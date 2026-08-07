---
title: "The 38 million parameters we did not need"
date: 2024-12-18
summary: "A course project at DTU, set by a PhD student working with Trackman. He had a CNN that estimated golf ball velocity from Doppler radar and challenged us to either reproduce it or beat it. Three approaches later we had a model 18% more accurate on 96% fewer parameters."
links:
---

*02456 Deep Learning, DTU Compute, Fall 2024. Written with Alisha Kiefer, Florian Dirnberger and Raimo Sieber.*

DTU runs 02456 with industry involvement, and Trackman is one of the companies that works with the university on it. The project we picked came from a PhD student whose research was already running in collaboration with them. One piece of his work was estimating the initial velocity of a golf ball from Doppler radar using deep learning, and he brought that piece into the course as a challenge.

Initial velocity matters more than it first looks. It is a number the golfer sees, but it is also an input to the trajectory calculation, so an error in it propagates into carry distance, landing position and everything else the system reports downstream. Getting it right early is cheaper than correcting for it later.

He arrived with a working baseline: complex time series from the radar, stacked into a spectrogram, passed through a convolutional network that outputs one number. Multiple convolutional layers with ReLU and max-pooling, three fully connected layers, a single output. It got the job done. His challenge to us was to see whether we could reproduce his results, and if we could, whether we could find anything better.

## The second axis

The baseline gets a test RMSE of 1.443 m/s. It also carries 38,414,929 parameters and takes 29 ms per inference.

RMSE here is the usual thing, over a set of N shots with true initial velocity `v` and prediction `v̂`:

```
RMSE = sqrt( (1/N) · Σ (v̂ᵢ - vᵢ)² )
```

Accuracy on its own is not a hard target to move. If you are allowed to spend anything, a bigger model is always available, and beating 1.443 m/s by throwing capacity at it would not have told anybody something they did not know. The question that seemed worth answering was whether the problem needs 38 million parameters at all.

So we treated every result as a pair, RMSE and cost, and counted a model as better only if it improved on one without giving ground on the other. That rule ended up disqualifying one of our three approaches, which is the rule doing its job.

## Three places to intervene

![The three approaches mapped onto the data path](/assets/images/doppler_imgs/p1_0_Im1.png)
*The radar produces a complex time series. The baseline converts it to a spectrogram and hands that to a CNN. We attacked the pipeline at three different points along it.*

The pipeline has an axis running through it: how much work is done by hand before the network sees the data, and how much the network is left to work out for itself. The baseline sits in the middle, since it constructs the spectrogram by hand and then lets a CNN learn everything after that.

We picked one approach on either side of it and one on top of it. Going earlier means skipping the spectrogram and regressing velocity straight from the raw time series with a recurrent model. Going later means keeping the spectrogram and preprocessing it further before the CNN sees it. The third leaves the data alone and works on the architecture.

Splitting it this way was partly practical, since four people can run three things in parallel, and partly a hedge. One term, one GPU budget, no reason to put it all on a single hypothesis.

## Approach one: skip the spectrogram

The radar outputs four signals, split into real and imaginary parts, giving 8 channels of 1600 time-series points per sample. Feed that into a recurrent feature extractor, attach a fully connected regression head, read out a velocity.

![Time series network architecture](/assets/images/doppler_imgs/p2_1_Im2.png)
*Feature extraction with a recurrent model, then a fully connected network for the regression.*

We built all three of the standard cells. A plain RNN carries a single hidden state forward:

```
hᵗ = tanh( W · [ hᵗ⁻¹ ; xᵗ ] )
```

An LSTM adds a memory cell and three gates that control what enters it, what leaves it and what gets forgotten:

```
[ i ; f ; o ; g ] = [ σ ; σ ; σ ; tanh ] ( W · [ hᵗ⁻¹ ; xᵗ ] )

cᵗ = f ⊙ cᵗ⁻¹ + i ⊙ g
hᵗ = o ⊙ tanh(cᵗ)
```

A GRU merges the hidden and memory states and gets by with two gates, an update gate `z` and a reset gate `r`:

```
[ r ; z ] = [ σ ; σ ] ( W · [ hᵗ⁻¹ ; xᵗ ] )

hᵗ = (1 - z) ⊙ hᵗ⁻¹ + z ⊙ tanh( Wₓ xᵗ + W_g (r ⊙ hᵗ⁻¹) )
```

The parameter cost falls straight out of how many weight matrices each one needs. For hidden size `h` and input size `x`, a single recurrent layer costs

```
RNN:  h(h + x) + h
GRU:  3 · [ h(h + x) + h ]
LSTM: 4 · [ h(h + x) + h ]
```

so an LSTM cell is four times an RNN cell at the same width, and a GRU three times. That is the whole trade. An RNN is cheapest but loses long-range structure through repeated multiplication by the same matrix. An LSTM holds it best and costs the most per step. A GRU sits between them. With 1600 steps per sample we did not know in advance which side of that we wanted, so we did not guess.

What mattered more than the cell choice was that we parametrised the model for flexible initialisation before training anything. Every dimension we might want to vary became an argument rather than a literal. That let us hand the whole family to a Weights & Biases sweep, sample configurations at random against validation RMSE, and then read parameter importance to see which knobs actually moved the loss and in which direction.

The best configuration from each of the three architectures landed at a validation RMSE between 8.4 and 8.6 m/s.

That is not a close miss. It is roughly six times the baseline's error, and on a driver strike at around 70 m/s it is a 12% reading, which gets proportionally worse the shorter the club. No amount of tuning around the edges closes a gap that size.

What the approach did produce was a cost profile nothing else came near. The best GRU runs at 640,769 parameters and 1 ms per inference, 29 times faster than the baseline. Wrong accuracy, right shape. We wrote it up as a direction rather than a result and moved the effort to the spectrogram.

## Approach two: preprocessing the spectrogram

Doppler velocity estimation was a signal processing problem long before it was a deep learning problem, and the classical methods for it are well understood. The second approach asked a simple question: if we do some of that classical work up front, does the CNN need less capacity to finish the job?

The feature we care about in the spectrogram is a change running horizontally, so we tested edge detectors on the power channels. Canny and Prewitt both went in. The Sobel operator applied in the x-direction only came out best, which fits the geometry of the signal.

Sobel approximates the image gradient by convolving a fixed kernel over the image. In its standard 3x3 form, for an input image `A`:

```
        ⎡  1   0  -1 ⎤
Gₓ  =   ⎢  2   0  -2 ⎥  ∗ A
        ⎣  1   0  -1 ⎦
```

Each row is a smoothing weight, each column a difference, so the whole operation is a difference in x smoothed in y. We ran it at 31x31 rather than 3x3, deliberately much wider than the textbook version, because the changes we wanted were large-scale horizontal transitions and the wider kernel averages away noise while keeping them. Gradient magnitudes were then computed and every channel normalised.

![Spectrogram before and after Sobel preprocessing](/assets/images/doppler_imgs/p3_2_Im3.png)
*Left, the raw spectrogram power channel. Right, after the 31x31 Sobel filter and normalisation.*

Then a random sweep with early stopping, 40 epochs per run, the same procedure we used everywhere else.

It did not improve on the baseline. Test RMSE came out at 1.608 against 1.443, and the model was larger, 65,522,361 parameters against 38,414,929.

The likeliest explanation is that the CNN was already doing this. Early convolutional layers learn edge-detecting kernels during training, and those learned kernels are free to adapt to the data in a way a fixed Sobel kernel is not. Supplying the edges in advance removes that freedom without adding information, and taking the gradient magnitude also discards the raw intensity, which the network may have been using for something.

That is a result about this preprocessing step, not about preprocessing generally. What we tested was one family, edge detection on the spectrogram power channels, and what we can say is that this family is largely redundant with what the first convolutional layer learns on its own. A preprocessing step that supplies something the network cannot derive from its input would be a different experiment, and approach one suggests where to look for one.

## Approach three: make the model searchable first

The baseline architecture was static. Fixed number of convolutional layers, fixed kernels, fixed everything, with no batch normalisation, no dropout and one activation function. That is a perfectly sensible thing to build when your goal is to establish that the problem is solvable at all, which is what it was for.

You cannot search a static model, though, so the first job was not searching. It was rewriting the baseline as a dynamic architecture where the structure is constructed from configuration at initialisation time.

![The modified CNN architecture](/assets/images/doppler_imgs/p3_4_Im5.png)
*Every block is constructed from configuration rather than hardcoded, which is what makes the sweep possible at all.*

That gave us twenty hyperparameters: layer counts and channel widths, kernel size, stride, padding, pooling, batch normalisation on the convolutional and linear sides, two separate dropout rates, six activation functions, five weight initialisations, four optimisers with their associated learning rate, weight decay and momentum, and the width and depth of the fully connected head.

We also added one thing that was not in the baseline: a spatial attention layer after each convolution. It is a 1x1 convolution followed by a sigmoid, producing an attention map that is multiplied back into the feature map elementwise.

```
A  = σ( W₁ₓ₁ ∗ X )        A ∈ [0,1], one value per spatial position
X' = A ⊙ X
```

The justification is specific to this problem rather than general. Estimating initial velocity means reading one region of the spectrogram rather than integrating over the whole image, so a mechanism that can suppress everything else should help. It was still exposed as a boolean in the search rather than assumed, and the sweep turned it on in both of the models we ended up selecting.

## Twenty hyperparameters, and why we did not grid search them

Take the product of the value set sizes across all twenty hyperparameters and you get about 7.5 x 10¹⁰ configurations. A full grid is not slightly infeasible, it is infeasible by roughly eight orders of magnitude on the hardware a course project gets.

The fallback is a random sweep, and we ran one: 2000 runs at 50 epochs each. Worth being clear about what that covers. 2000 out of 7.5 x 10¹⁰ is 2.7 x 10⁻⁸ of the space, so any claim that we found the optimum would be nonsense. What a random sweep can do is find a good region, and it does that far more efficiently than a grid because most of those twenty dimensions barely matter and grid search spends the same effort on all of them.

But random sampling over a space that large still spends most of its budget on configurations that were never going to work. So the real effort went into the constraints rather than the sampling. Three of them, in order of how much compute each saved.

### A hard cap on model parameters

Capped at 2.5 x 10⁸, and worth explaining because the reason it works is structural rather than empirical.

A convolutional layer with `C_in` input channels, `C_out` output channels and a `k_h × k_w` kernel costs

```
C_out · ( C_in · k_h · k_w + 1 )
```

which for our value sets is small. Take the configuration the sweep eventually picked: 8 channels, a 5x7 kernel. A layer costs `8 · (8 · 35 + 1) = 2,248` parameters. Three of them come to under 7,000.

The spatial dimensions shrink through the network in a way that is fully determined by configuration. For an input of height `H`, kernel height `k_h`, padding `p`, stride `s` and pooling factor `m`:

```
H_out = ⌊ ( H + 2p - k_h ) / s + 1 ⌋ / m
```

and the same in width. So after the last convolutional layer `L` the flattened vector has length

```
N = C_L · H_L · W_L
```

and the first fully connected layer, which multiplies that vector by `h` hidden units, costs

```
N · h + h
```

That single multiply is where the parameters live. Working backwards from the selected model's 1,378,356 total and its 64 hidden units, `N` must be around 2.1 x 10⁴, which puts roughly 99% of the entire model in one matrix. The other 1% is every convolution in it.

Two things follow. First, you can control the count from either side, by shrinking `N` through kernel, stride, pooling, padding and channel choices, or by shrinking `h`. Second, and this is the useful part, all of those terms are known from the configuration before a single batch is loaded. Configurations over the cap get discarded at sampling time and cost nothing at all.

### Invalid combinations

Not every hyperparameter pairing is defined, let alone sensible. Weight decay and momentum do not mean the same thing across all four optimisers and are not defined for all of them, and some activation and weight initialisation pairings are not used by anybody for reasons that are already understood. Sampling them anyway means burning 50 epochs to discover something knowable in advance, so the sweep agent skips them.

### Non-convergence stopping

Any run still above 8 m/s RMSE after 10 epochs gets killed. The threshold was picked to be obviously generous, since the baseline is under 2 and our recurrent models sat at 8.4, so a CNN still at 8 after ten epochs is not on a trajectory to anywhere.

None of these three is clever. Each is a piece of knowledge we already had, written down as a filter so the search did not have to rediscover it 2000 times. That is most of what the third approach actually consisted of.

## Two models out of the sweep, not one

![Hyperparameter search space and the two selected configurations](/assets/images/doppler_imgs/p6_7_Im8.png)
*The twenty hyperparameters with their value sets, and the configurations of the two models we selected.*

We came out of the sweep with two configurations rather than a winner.

The first is the lowest validation RMSE after 50 epochs: 1.51, at 1,378,356 parameters. Three convolutional layers, 8 channels, 5x7 kernels, batch normalisation on both sides, attention on, no dropout anywhere, SGD at 1e-4.

The second is the smallest model among runs that still reached a respectable RMSE: 23,075 parameters at a validation RMSE of 1.97. That is 0.06% of the baseline's parameter count for an RMSE about 18% worse than the baseline's 1.668.

Reporting both was deliberate. Which one is correct depends on a hardware budget nobody had specified, and collapsing a two-axis result into a single ranking throws away the only information somebody choosing between them would need. It is also a useful check on the first model, since knowing that 23,075 parameters buys you 1.97 tells you what the remaining 1.35 million are for.

## Results

![Comparison of all four models](/assets/images/doppler_imgs/p4_5_Im6.png)

| | Baseline CNN | Time-series GRU | Preprocessed + CNN | Optimised CNN |
|---|---|---|---|---|
| Train RMSE [m/s] | 0.542 | 8.364 | 1.228 | 0.797 |
| Validation RMSE [m/s] | 1.668 | 8.452 | 1.925 | 1.592 |
| Test RMSE [m/s] | 1.443 | 8.452* | 1.608 | **1.182** |
| Parameters | 38,414,929 | 640,769 | 65,522,361 | 1,378,356 |
| Inference time [s] | 0.029 | 0.001 | 0.032 | 0.006 |

\* No held-out test data for the time-series models, so the test figure is the validation set.

The optimised CNN is 18% better than the baseline on test RMSE, on 96% fewer parameters, at roughly a fifth of the inference time.

One number in that table is more informative than the headline. The baseline's train and validation RMSE are 0.542 and 1.668, a gap of 1.13. The optimised model's are 0.797 and 1.592, a gap of 0.79. The baseline is the more accurate of the two on data it has seen and the less accurate on data it has not, which is the signature of overfitting. Thirty-eight million parameters with no batch normalisation or dropout will do that. The sweep switched batch normalisation on for both models it selected, without being told to.

The preprocessing approach is worse on both axes and stays in the report as a negative result. The GRU is unusable at 8.452 m/s and stays in for its 1 ms inference time.

## What we would do next

More targeted sweeps, narrowed around the region the random search found, rather than another uniform pass. A random sweep tells you where to look and is a poor tool for the last 10%.

Preprocessing the time series before the recurrent model. That is the same bet that did not pay in approach two, but made somewhere it has a better chance. The CNN was already learning edge features for itself; a recurrent model reading 1600 raw complex samples is much less obviously able to find the structure it needs, and 8.45 m/s suggests it was not finding it.

Fusing additional features into the CNN, shape information in particular, since the spectrogram carries more than the single region the velocity estimate reads.

The thing worth taking to the next project is simpler than any of that. The baseline was not a bad model, it was an unsearched one, built to prove the problem was tractable and then left alone because it worked. Nearly all of the 96% we removed came from making the model configurable and then constraining the search well enough that 2000 random samples were worth running. That is not a deep learning insight. It is just what happens when somebody finally looks.

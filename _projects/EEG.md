---
title: "Reading my own alpha waves off a breadboard"
date: 2023-10-07
summary: "Electronics 2 at the University of Iceland. Build a circuit that pulls 15 microvolt brainwaves out of the air and shows them on a scope. Most of the term went on finding out that electrolytic capacitors do not work at 10 Hz."
---

Neurons in your brain pass electrical signals between each other, and the sum of all that activity leaks out through your skull as an electromagnetic field. It is a very small field, around 15 µV, but it is there and you can measure it. Doing so is called electroencephalography, and the design brief was to build a circuit that does it.

Brain activity is sorted into bands. Beta, 14 to 30 Hz, is what you produce awake and working on something demanding. Alpha, 8 to 13 Hz, is awake and at rest. Theta, 4 to 7 Hz, is asleep. We went for alpha, partly because it is the easiest band to produce on demand by closing your eyes and doing nothing.

![The brainwave bands](/assets/images/EEG/01-brainwave-bands.png)

So the circuit needs to pass 8 to 13 Hz and reject everything else: a high-pass above 8 Hz, a low-pass below 13 Hz, and a lot of gain to lift 15 µV somewhere a scope can see it. It also needs a notch at 50 Hz, because that is the mains frequency in Europe and the room is full of it.

## Starting from somebody else's circuit

We took a base design from an Instructables DIY EEG build and made three changes: the 60 Hz notch became a 50 Hz notch, the second 60 Hz notch came out, and we used LM741 op-amps instead of TL084CNs because those were what we had.

Then we put it into LTspice.

![The original schematic in LTspice](/assets/images/EEG/02-original-schematic.png)

![The original Bode simulation](/assets/images/EEG/03-original-bode.png)
*The 50 Hz notch is not in this plot. Simulating that stage on its own showed it working fine.*

Here is the part worth writing down. The Bode plot of the full circuit did not show the 50 Hz notch doing anything. Simulating the notch stage by itself showed it working. Two simulations of the same circuit disagreeing with each other is a result, and the correct response is to find out which one is lying.

We assumed it was fine and started building.

## What the breadboard said

The build went in stages, one block at a time, each checked before the next went in. Every stage got ±9 V from a bench supply and a low-amplitude sine from the scope's function generator into a 50 Ω load, and we swept it.

| | |
|---|---|
| Oscilloscope | Rohde & Schwarz RTB2004 |
| Power supply | Tenma 72-8690 |
| Multimeter | Fluke 17B+ |

The 50 Hz notch and the 33 Hz low-pass both came back flat. No shape at all. We hoped that connecting everything together would somehow resolve it, which it did not, so a sine into the differential amplifier at the front produced the same wrong answer at the back.

At that point we stopped hoping and got the multimeter out. Driving the circuit with AC and probing through it, the voltages across the capacitors and at the op-amp pins were zero. Not small. Zero.

The answer took a lot of searching to find, and it is a component problem rather than a topology problem: op-amps and electrolytic capacitors both behave badly at very low frequencies. Electrolytics have leakage current and poor tolerance, which matters when the impedance you are trying to set is enormous, and the 741 is not a low-frequency precision part. At 10 Hz the filters were not filtering, they were just sitting there.

We rebuilt the notch and the low-pass around passive networks with ceramic and film capacitors instead.

![The updated schematic](/assets/images/EEG/04-updated-schematic.png)

![The updated Bode simulation](/assets/images/EEG/05-updated-bode.png)

Ten Hz is a strange place to do analogue design. Most component behaviour you learn is quietly assuming you are somewhere in the audio band or above, and a lot of it stops being true below it. That is the whole lesson of the project, and it cost us most of the term.

## Sticking wires in my head

![The finished build](/assets/images/EEG/06-final-build.png)

The last step was two wires twisted together to reject common-mode noise, one end into the input of the circuit, the other end onto my scalp, at the occipital and temporal positions. It was slightly unpleasant. It did not matter.

![Professor J](/assets/images/EEG/07-professor-j.png)
*Professor J.*

![FFT of the measured brainwaves](/assets/images/EEG/08-fft-brainwaves.png)

There it is. Clear gain across 8 to 13 Hz, which is what the circuit was built to do.

What surprised us was how much mains interference is still visible given how hard the notch attenuates at 50 Hz. So we measured the room instead of the circuit: FFT of the environment, with nothing running through the amplifier at all.

![FFT of the ambient interference](/assets/images/EEG/09-fft-environment.png)
*The 50 Hz peak is more than 60 dB above everything else in the room.*

Sixty decibels is a factor of a thousand. The notch is doing a lot of work and there is still plenty left over, which reframes the problem: the interference is not a detail to clean up at the end, it is one of the largest signals in the system and the design has to be built around it. Moving the board further from the wall sockets cut it noticeably, which is a reminder that physical layout counts as circuit design.

![Measured Bode plot of the circuit](/assets/images/EEG/10-measured-bode.png)

Last, a measured Bode plot using the scope's built-in sweep. It cannot start at 0 Hz, but from 10 Hz up the shape matches the simulation. The gain sits lower everywhere, almost certainly because the trim pot that sets the gain was at a different value than the one we simulated. The shape across the band we care about is the same.

## What we would do differently

Use real electrodes rather than hotwiring my head. We did try to borrow some, and it turns out that people who own EEG electrodes are not enthusiastic about lending them out.

Rebuild the filters with active stages chosen for this frequency range, now that we know what the constraint actually is.

And the one we actually wanted to get to: put a microcontroller on the output and do the FFT in software, then threshold it. Alpha peak detected, output one. No peak, output zero. That is one bit, and one bit is enough to control something. We lost that to debugging.

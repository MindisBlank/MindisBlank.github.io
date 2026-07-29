---
title: "The phase imbalance hiding in 80 substations"
date: 2026-04-15
summary: "My master's thesis at DTU, done with Veitur in Reykjavík. Finding low-voltage substations where the load sits unevenly across the three phases, and working out what that costs in wasted energy and lost cable capacity."
links:
  - name: Thesis (PDF)
    url: /assets/thesis-jason-quinn-2026.pdf
---

*Master's thesis, DTU Wind & Energy Systems, in collaboration with Veitur. Supervised by Kai Heussen (DTU) and Corey Harpe (Veitur). April 2026.*

An electrician wiring an apartment building picks a phase. Nobody writes down which one. Do that a few hundred thousand times across a city and you get low-voltage networks where one phase quietly carries twice what its neighbours do.

That costs you twice. Resistive loss goes with the square of the current, so moving load from a light phase onto a heavy one always burns more copper than it saves. And the neutral, which sits at zero when the three phases are even, picks up a return current that does no work at all. Then there is the capacity problem, which is arguably worse: a cable is rated by its highest loaded phase, so an uneven feeder hits its thermal limit while a third of its capacity is still sitting idle on the phases nobody loaded.

![Balanced versus imbalanced loading at the same total current](/assets/images/thesis/01-balanced-vs-imbalanced.png)
*Same total current, both cases. On the right, phase A is at the limit while B and C have room to spare. The cable is full.*

Veitur has smart meters at roughly 160,000 customers and power quality monitors in 88 substations, so in principle the data to measure all of this already exists. In practice, most of my thesis went on getting those two datasets to agree about anything at all.

## Why anyone should care

The energy is worth about 0.08 €/kWh at distribution level in Iceland. On its own that is not a headline number, but it repeats across more than a thousand substations, every hour, forever.

The capacity side is where the money actually is. Orkuveita Reykjavíkur's 2026-2030 plan puts group investment at ISK 244.5 billion, a good chunk of it network reinforcement. If a cable is going to be dug up and replaced because one phase reached its rating, and the other two phases were half empty at the time, that is a very expensive way to solve a wiring problem.

It also gets worse on its own. Iceland's electrification targets have essentially all new private cars going electric by 2030-2040, and that load lands at low voltage, on networks that are already uneven. Nobody coordinates which phase a new charger ends up on.

Monitoring work in the UK has found more than half of low-voltage feeders seriously unbalanced, with losses 20-30% above the balanced case. Plenty of papers then go on to optimise a re-phasing plan with genetic algorithms or similar. Almost all of them assume the phase labels in the data are correct and the timestamps line up. That assumption is where the real work turned out to be.

## The data you actually get

There are three sources, and none of them agree with each other out of the box.

The substation meters record three-phase current and voltage at the transformer's low-voltage busbar, storing a minimum, average and maximum for each interval rather than raw waveforms. They see current through current transformers, which matters later. The smart meters give per-phase voltage and current every five minutes and active power every ten. The utility's GIS gives cable types, lengths and connectivity for every asset, but no electrical parameters at all, so resistances had to come from standard conductor tables.

### The current transformer problem

This one took a while and is still my favourite part of the project.

When I added up the smart meters under a substation and compared the total against what the substation meter reported for the same period, the substation was consistently higher. Not noisily higher. The two traces had the same shape, the same daily pattern, the same peaks, just a persistent gap in magnitude.

Smart meter rollout is incomplete, so some load genuinely isn't counted. Electricity theft would also inflate the gap. Or the current transformer ratio programmed into the substation meter was simply wrong, which scales every reading by a constant.

Theft was easy to dismiss. The gaps were large, persistent, and showed up on many substations at once, and that much theft turns up in the bulk energy balance long before it turns up in my analysis.

So I plotted substation current against smart meter current for each substation and fitted a line. Incomplete coverage gives you a poor fit with scatter. A wrong ratio gives you a tight fit with the wrong slope. That is exactly what several substations showed.

![Substation current against smart meter current, before correction](/assets/images/thesis/04-ct-scatter-before.png)
*Each panel is one substation. The dashed line is 1:1. A tight fit with a slope of 1.72 is not a coverage problem.*

Then I pulled the configured ratios off the server the meters report to and checked them against the transformer ratings in the GIS. Three substations were programmed at 2600/5, 1600/5 and 2250/5 against transformers that all needed 1200/5. Fixing the ratios moved the slopes from 1.72, 1.10 and 1.56 down to 0.80, 0.82 and 0.83, which is about where incomplete smart meter coverage should leave them.

![The same substations after correcting the ratios](/assets/images/thesis/05-ct-scatter-after.png)
*Same substations, corrected. Correctly configured ones did not move.*

If you install substation monitoring without a step that checks the configured ratio against the transformer it's sitting on, you end up with measurements that are wrong by a constant factor and internally consistent enough that nothing looks broken. Every number downstream inherits the error and nobody notices.

One substation stayed wrong after correction. Configured ratio looked fine, slope still didn't. I never worked out what's going on there; it needs somebody to open the cabinet and look.

### Phase labels that mean nothing

The next problem has no clean fix. L1 on one smart meter is not the same physical conductor as L1 on the meter next door, and neither necessarily matches L1 at the substation. Sum up the meters under a substation and the total current tracks the substation reading nicely. The split across the three phases does not resemble it at all.

![Smart meter phase currents against substation phase currents for the same substation](/assets/images/thesis/03-phase-label-mismatch.png)
*Same substation, same two days. The totals agree. The per-phase split does not.*

So the per-phase picture has to come from the substation meters, and the smart meters only enter as a scaled total. Correcting the labels properly means running a phase identification algorithm on every meter, which is its own research problem and was never going to fit in the time I had.

There was a second reason to build it this way. One substation meter over thirty days at fifteen-minute resolution is 8,640 numbers. One feeder with 150 smart meters at five minutes is about 3.9 million. That is 450 times the data for a screening job that has to run across a whole city. Starting from roughly a hundred substation devices rather than 160,000 meters wasn't really a compromise; it was the only version of this that scales to a whole utility.

### Two smaller things that ate more time than they should have

The substation meters timestamp their samples with a bit of drift: 10:01.023 where the smart meters give a clean 10:00. Join the two on timestamp and most of your rows vanish without warning, and the ones that survive are a biased sample. The fix is a ten-second snap tolerance, then averaging anything that collides in the same bin.

The other one I could not fix at all. The multi-channel substation meters were wired to monitor individual outgoing cables, but only on L1, and the metadata mapping each input to a specific feeder was gone.

![How the multi-channel meters were wired](/assets/images/thesis/02-umg801-wiring-limitation.png)
*The master unit sees all three phases at the busbar. The slaves see one phase each of four different outgoing cables.*

That one wiring decision, made years before I turned up, set the spatial resolution of everything I did afterwards. I can tell you a substation is unbalanced. I can't tell you which of its feeders is responsible.

### What all of that was for

Here is what falls out the other end.

![Network model of one substation, built from GIS connectivity and cable data](/assets/images/thesis/07-network-topology-670sp1.png)
*One 800 kVA substation as the simulation sees it: 125 cable segments, 122 nodes, 268 connected meters. Red square is the transformer, blue diamonds are junction cabinets, green dots are connection points. Purple is feeder trunk, green is distribution cable between cabinets, orange is service cable to the customer. Positions are a spring layout, not geography, so read it as connectivity and not as a map.*

That picture is the whole point of the previous four sections. Every node in it came from GIS connectivity records, every edge carries a cable type and a length pulled from the same export, every resistance was assigned from conductor tables because the GIS did not hold electrical parameters, and every green dot has a load profile attached to it that came out of the smart meter data after the corrections above. None of those datasets were built to be joined to each other. Getting them into one graph that solves is most of what I actually did for six months.

The shape of it matters more than I expected going in. One transformer, a handful of trunk cables, then it fans out fast into cabinets that each serve a dozen or so customers. Imbalance introduced at the far edge of that tree, where the single-phase connections live, comes all the way back down the trunk as neutral current.

But the damage does not spread evenly on the way. Losses and thermal limits are per segment, and these 125 segments have very little in common with each other. The trunk leaving the transformer carries everything the substation serves. A service cable feeding one apartment carries almost nothing, and is thin enough that it feels what it does carry. Two substations can show the same phase split at the busbar and be in completely different trouble depending on what the tree behind them looks like and how hard it is being pushed. That is the question the capacity results answer later, and it only becomes askable once the network exists as a graph with real lengths and cross-sections in it.

## The method

### Measuring imbalance

The standard voltage unbalance factor needs synchronised phasors, which substation meters do not provide. What they do provide is per-phase RMS current, so I used a current unbalance ratio: the largest gap between any two phases, divided by the total current.

```
CUR = max(|Ia - Ib|, |Ia - Ic|, |Ib - Ic|) / (Ia + Ib + Ic)
```

It's bounded between 0 and 1, and whichever pair produced the maximum tells you which phase is the problem, which is what makes the culprit-pair diagnostics possible. It's also scale invariant, since top and bottom are both linear in current. That last property means the current transformer errors above can't corrupt the screening at all, which was a slightly deflating thing to realise after weeks of chasing them.

### Stage one: screen everything

![The screening pipeline](/assets/images/thesis/06-screening-pipeline.png)

Pull every substation meter, normalise the channel naming (some devices label phases L1/L2/L3, others Input01/02/03), snap onto a fifteen-minute grid, quality check, compute the ratio. Fixed study window of August to October 2025, no manual exclusions, no random steps. Same inputs give the same outputs.

One filter matters: only timestamps where total current is at least 90 A. At low load a few amps of difference between phases produces an enormous ratio that means nothing operationally. I found the threshold by walking it up from 30 A until the rankings stopped moving.

Averaging each substation over the full three months and ranking gives the shortlist. Nine of 80 sit above 15%. One sits at 85%.

![Top 30 substations ranked by average imbalance](/assets/images/thesis/11-top30-sp-ranking.png)

### Stage two: characterise the shortlist

A ranking tells you where to look but not what you are looking at. For each shortlisted substation I generated the imbalance over time, coloured by which phase pair was responsible, plus an exceedance curve: for any threshold, what fraction of the three months sat at or above it.

![Exceedance curves for the shortlisted substations](/assets/images/thesis/12-exceedance-curves.png)
*The curve separates a substation that is mildly unbalanced all the time from one that is fine except for occasional excursions. An average cannot do that.*

### Stage three: put a number on it

This is the part I would have liked more time for. For every fifteen-minute interval I solved the network twice with a three-phase power flow: once with the measured phase split, once with the same total load spread evenly. Identical load, identical topology, the only difference is the balance. Subtract, and what is left is the cost of the imbalance and nothing else.

Loss accounting is the sum over cable segments of (Ia2 + Ib2 + Ic2 + In2) times resistance times length. The neutral term is the whole point. It is exactly zero in the balanced run.

![Losses over one month, split into phase and neutral](/assets/images/thesis/08-loss-decomposition-670sp1.png)
*The same substation as the network model above, over September. Grey is total loss under the measured case. Blue and orange are the extra loss caused by imbalance, split into phase conductors and neutral. The orange is energy that simply would not exist if the load were even.*

The judgement calls, in case anyone wants to argue with them:

Reactive power is not measured per phase, so I assumed a power factor of 0.9 throughout. Smart meter coverage varies from 6% to 100% between substations, so currents get scaled up by the inverse of coverage, with the same factor applied to both runs so the comparison stays fair. Cable resistance comes from standard tables at 20 °C with no thermal feedback, and transformer copper and iron losses are left out entirely because the nameplate data did not exist. Both of those last two push the same way: what I report is a floor, not a ceiling.

The awkward one is phase assignment. Since the meter labels are unreliable, I could not simply put each meter on its recorded phase. Instead I took the phase split measured at the substation, sorted the meters by average consumption, and dropped each one onto whichever phase was furthest below its target share. The simulated split at the feeder head then matches what the meter actually saw, rather than just matching the number of meters. It is deterministic and it gets the aggregate right, but it does not reproduce where in the network each load physically sits.

For capacity I took the gap between peak-phase utilisation and the balanced equivalent for each cable segment at the 99th percentile, then converted that to years using a compound growth rate. Two scenarios, 3.4% and 3.9% annual growth.

## What came out

Most of the network is fine, and I want to be clear about that before quoting any alarming numbers. Across every substation and every high-load interval, the average imbalance ratio is 9.5% and the median is 7%. Ninety-two percent of samples sit in the lowest severity band.

The tail is the interesting part. Nine substations out of 80 are chronically unbalanced, and six of those went through the full power flow analysis for September 2025.

**Cable losses went up 57% on average.** In absolute terms, 677.6 kWh over a single month across six substations, and the majority of the extra is dissipated in the neutral, where none of it does any work.

![Loss increase by substation](/assets/images/thesis/13-loss-increase-by-sp.png)

![Losses split into phase and neutral, balanced against unbalanced](/assets/images/thesis/14-loss-breakdown-phase-vs-neutral.png)
*Solid bars are the balanced counterfactual, faded bars the measured case. Orange is neutral loss, which the balanced case does not have.*

**Rebalancing frees an average of 7.9 percentage points of cable capacity**, across 185 segments. Median 6.5, with a long tail and one segment at 40.1. Converted to time, that is 16.1 years of deferred reinforcement at 3.4% load growth, 14.1 years at 3.9%.

![Reinforcement deferral under two growth scenarios](/assets/images/thesis/17-reinforcement-deferral.png)

### Every number above is an average, and averages hide this problem

That 7.9 point figure is not describing any actual cable. Half the 185 segments gain under 6.5 points, a handful gain over 30, and one gains 40.1. A re-phasing campaign aimed at the worst few captures most of what is available, so it's a short list rather than a network-wide programme, and you can only see that by looking at the distribution instead of the mean.

The same thing happens one level up. The fleet-wide average imbalance is 9.5%, which sounds like a network with no problem worth investigating. The substation running at 85% for three straight months is inside that average and barely moves it. So is every other case in this write-up.

That is why the screening is built the way it is: nothing gets averaged until after the ranking, and the diagnostics use exceedance curves rather than summary statistics. Aggregate first and you produce a number that is technically correct and hides every case worth finding. If you take one thing from this work, take that. Phase imbalance is a tail problem at every scale you look at it, across the fleet, across a substation's feeders, and across the segments of a single feeder.

### A bad split is not the same thing as a problem

The six substations that went through the full analysis were all flagged as chronically imbalanced by the same screening. Their additional losses over the same month ranged from 1.7 kWh to 400.9 kWh. Same shortlist, more than two hundred times apart in what they actually cost.

The one at the bottom of that range has no single-phase customers at all and sits at low load. Its split is real and persistent, and correcting it would recover nothing anyone would notice. The one at the top is a large residential feeder where 90% of the connections are single-phase.

This turns up again in the two case studies below. The most extreme split in the entire dataset, 90/5/5, produces a 48.3% loss increase. A far milder 43/40/17 split produces 67.6%. Loss scales with the square of current, so severity of the split is only one of the three terms that matter, and the other two are how much current is flowing and what the cable network behind the meter looks like.

The practical version: a ranking by imbalance alone gives you a work list sorted by the wrong key. It is the right tool for deciding where to look, and the wrong tool for deciding where to dig.

### Two substations worth looking at

The largest on the shortlist has an 800 kVA transformer, 79 cable segments and 326 connected meters, 90% of them single-phase. Its long-run split is 43/40/17. The same phase pair is responsible 73% of the time across twelve weeks, and that consistency is the finding: if the imbalance came from a big intermittent load switching on and off, the culprit pair would wander. It does not. This is a fixed allocation of single-phase customers, decided at installation, and it will sit there until someone moves it.

![Imbalance over the study window](/assets/images/thesis/18-579sp1-cur-timeseries.png)

![Phase currents over the same period](/assets/images/thesis/19-579sp1-phase-currents.png)
*Two phases run 200-350 A and peak past 450. The third rarely clears 150.*

Losses come to 993.9 kWh over the month against 593 kWh balanced, so 400.9 kWh of pure imbalance penalty, a 67.6% increase. It also has the most recoverable capacity of the six at 12 points on average.

The other one is stranger. Its split is 90/5/5, with the imbalance ratio locked between 82 and 90% for three straight months.

![Phase currents at the extreme case](/assets/images/thesis/21-1299sp1-phase-currents.png)
*One phase carries essentially everything. The other two hover near zero for three months.*

I am not going to pretend I know what causes that. A split that extreme does not come from customers gradually accumulating on one phase. It is more likely a wiring or documentation error, or a fault in the meter itself. I checked it against the aggregated smart meters and found nothing that would justify throwing the reading out, so I kept it.

It doesn't really matter which it is, though. If the split is real, it's a large and cheap thing to fix. If it's a sensor fault, it's a metering problem worth a site visit. Either way this is exactly the kind of thing you want a screening tool to drag into view.

And it is still the substation that comes second on losses, not first, despite having by far the worst split in the dataset. The one before it is bigger, busier, and has more cable behind it.

## What I would do differently

The reconciliation work, the ratio corrections and timestamp alignment and coverage scaling, took most of the project. I would budget for that from day one instead of finding it. It is also the part with the longest shelf life: once the two data sources agree, they agree for every future analysis, not just mine.

The gap I did not close is the one that matters most operationally. I can tell you a substation runs 43/40/17 and that the third phase is starved. I cannot tell you which of its 326 meters to move. Getting there means identifying each customer's phase from voltage patterns in the smart meter data, which is being worked on both in the literature and in DTU's 3PhaseInsight project. That step is what turns this from something a planner reads into something that generates work orders.

Three months, August to October, so no winter. Reykjavík's seasonal swing is not electric heating, since the city runs on geothermal, but people are indoors more when it is dark and cold. Whether that changes the shape of the imbalance or just its size, I genuinely cannot tell from my data.

And the headline numbers rest on three assumptions I never got to test properly: the 0.9 power factor, the 20 °C cable resistance, and the growth rates. A sensitivity analysis on those is the obvious next thing.

Fifteen-minute averages also hide transients. A car charger ramping up on a single-phase connection spikes one phase well above the interval average, so my peak utilisation figures are, if anything, optimistic.

## Thanks

To Kai Heussen, whose questions had a habit of leaving me thinking for hours after a twenty-minute meeting. To Corey Harpe and the team at Veitur, who provided the data and then patiently answered a great many questions about why it looked the way it did. And to the 3PhaseInsight project at DTU for the wider context.

The full thesis is linked at the top. If you want the derivations, the full results tables, or the parts I glossed over here, they are all in there.
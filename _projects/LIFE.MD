---
title: "LIFE: Lunar Infrastructure for Future Exploration"
date: 2025-06-15
summary: "A group project designing a two-phase lunar base near the equator. My part was the power grid that moves 148 kW from a solar farm to the habitat, furnace and landing pad, and the surface communication network that shares its trench."
tags: [power systems, communications, space systems, university project]
image: /assets/images/life-figures/fig-8-25-phase-one-grid-topology.png
links:
  - title: "Full report (PDF)"
    url: /assets/LIFE_project.pdf
---

*Group project, 30320 Spacecraft Instrumentation Systems, DTU. June 2025. The full report is linked above.*

## What the project was

LIFE stands for Lunar Infrastructure for Future Exploration. The assignment was to design a permanent lunar base end to end: habitat, radiation shielding, resource processing, rovers, a landing pad, power, communications, and the order it all arrives in.

The purpose of the base shaped every design choice, so it is worth stating first. LIFE is not a mining outpost. Most current lunar programmes, NASA's Artemis included, aim for the south pole, where water ice makes propellant production and commercial return plausible. LIFE has a different goal: take the technologies a moon settlement would depend on, most of which exist only as papers and prototypes at low technology readiness level (TRL, the scale used to grade how far a technology is from flight-proven), and run them on a real planetary surface until they either work or fail in an instructive way. The Moon is close enough to reach and harsh enough for the test to mean something.

That is also why the base sits near the equator instead of the pole. The terrain is simpler, the environment is well documented because the Apollo missions landed there, and nothing in the mission depends on water ice.

The mission runs in two phases. Phase 1 is the minimal working base: a solar farm of thirty 4 × 4 m panels sized for a continuous demand of 148 kW, a lithium-ion battery bank, the habitat, a landing and launch pad 2 km away, and a furnace that melts regolith (the loose surface material) into interlocking pavers for the pad. Phase 2 lands a 1.5 MW nuclear reactor 3 km from the habitat and connects it to the existing grid, which takes the base from operating to expanding.

The design philosophy throughout is modularity with graded redundancy. Every system is built in stages, and each stage has to connect to the previous one without modifying it. Redundancy is assigned by consequence: the parts that keep people alive tolerate two simultaneous failures, the rest tolerate one or none. The arrival of the Phase 2 reactor is where both principles get tested.

My part was power transmission and surface communication network. The others generated the electricity or consumed it.

## AC or DC

The first decision for the grid was whether to distribute alternating current (AC) or direct current (DC).

DC, and the core of the argument is short. The solar array produces DC. The batteries charge and discharge DC. Every planned load runs on DC. An AC grid would insert converters at both ends of that chain, each losing around 10% of what passes through, to arrive back where it started.

The secondary arguments point the same way. DC has no skin effect, an AC phenomenon where current crowds toward the surface of a conductor and raises its effective resistance, by about 2% at 60 Hz. A DC grid needs no frequency or phase synchronisation between sources, which is a large part of grid engineering on Earth. It also radiates less electromagnetic interference.

One argument I could not settle. Lunar dust carries an electrostatic charge and lofts off the surface through the day–night charging cycle. An AC line would surround itself with an alternating field that attracts and repels those grains for as long as it is energised, and I found no research measuring what that does to dust adhesion or lofting. It may be nothing. With DC it stays nothing.

The honest cost of DC is fault protection. AC current passes through zero twice per cycle, which is the moment a breaker can cheaply extinguish an arc. DC has no such moment, so interrupting a fault is harder. Solid-state circuit breakers are the answer, and terrestrial high-voltage DC projects are maturing them quickly, but this remains the weakest point of the choice.

### Stepping the voltage

Voltage conversion is the one thing AC does better, and it is the reason AC won the original argument between Edison and Tesla in the 1880s. A conventional transformer is two windings on an iron core: simple, reliable, and heavy, with most of the mass in the core.

The required core cross-section falls as frequency rises:

$$A_c = \frac{E_{rms}}{\sqrt{2}\pi f N B_{max}}$$

![Required transformer core cross-section against operating frequency](/assets/images/life-figures/fig-7-28-transformer-core-vs-frequency.png)
*Required core cross-section against operating frequency, for a 230 V, 300-turn winding at 1.2 T peak flux density. At 50 Hz the core is enormous. In the tens of kilohertz it shrinks to something worth launching.*

A solid-state transformer (SST) is built around that relationship. Fast semiconductor switches, made from silicon carbide or gallium nitride, chop the DC into AC at tens of kilohertz; a small transformer changes the voltage; a rectifier converts it back to DC. The result is about three times lighter than a conventional 50/60 Hz transformer, better than 95% efficient, and able to pass power in either direction. None of this existed in the 1880s, which is why the old answer does not carry over.

### Choosing the conductor

I screened eight candidate materials: copper, aluminium, calcium, beryllium, magnesium, silver, gold, and carbon nanotubes. The criteria were resistivity, density, thermal expansion, radiation tolerance, ductility at lunar night temperatures, and whether the material exists in the regolith for future local production.

Calcium has the best resistivity-to-weight ratio on the list and stays ductile in the cold. It is also so reactive that it oxidises rapidly in air and reacts violently with water, so the risk is not operating it on the Moon but getting it off Earth intact. Magnesium fails for the same reason. Beryllium is brittle and toxic, poor properties for a cable that rovers drive over and astronauts handle. Silver and gold conduct well and weigh far too much. Carbon nanotube conductors might be the right long-term answer, but no process today produces them in kilometre lengths.

That leaves copper and aluminium, and aluminium wins on density: a resistivity of 2.6 × 10⁻⁸ Ω·m at a third of copper's weight, ductile in the cold, unaffected by radiation, and present in the lunar regolith, which leaves the option of producing conductors on site later.

![Cable mass against transmission distance for various conductor materials](/assets/images/life-figures/fig-7-30-cable-mass-by-conductor-material.png)
*Cable mass against transmission distance for the candidate conductors, sized for 1 MW at 11 kV with a 5% loss limit. Aluminium and calcium need the least mass; dense metals like gold become prohibitively heavy over long runs.*

Three layers go over the conductor. Kapton, a polyimide film, provides the electrical insulation: it holds 272 kV/mm and tolerates radiation and temperature extremes, where the alternatives, Teflon and silicone rubber, degrade under radiation. Kapton's weakness is abrasion, and lunar dust is made of sharp glassy fragments, so the Kapton gets a 0.1 mm boron nitride ceramic coating. Outside that sits 1 mm of braided aluminium mesh for mechanical protection, the same construction as a braided plumbing hose, which also keeps the cable flexible enough to wind onto a spool.

Sizing the conductor to a 5% transmission-loss limit, with a safety factor of five on the insulation, the masses came out lower than I expected. A 100 m run carrying 155 kW at 222 V is about 60 kg. The 3 km Phase 2 line carrying 1.575 MW at 11 kV is about 360 kg. Each spool is cut to length and labelled for its specific run before launch, so nobody has to measure and cut cable in a pressure suit.

## Grid layout

Phase 1 divides into three sections: two low-voltage zones at 222 V and one high-voltage link at 3 kV, each organised around aluminium bus bars that act as common connection points with basic protection and measurement.

![Proposed Phase 1 grid topology](/assets/images/life-figures/fig-8-25-phase-one-grid-topology.png)
*Phase 1 grid topology: two low-voltage zones at 222 V and one 3 kV transmission section. Bus bars connect the loads and sources, with solid-state transformers wherever the voltage changes.*

Redundancy follows the N−1 and N−2 convention from terrestrial grid planning: an N−1 section keeps operating after any single line failure, an N−2 section after any two at once.

LV222.01 carries the batteries, solar farm, habitat and communications. Life support depends on it, so it is built to N−2. With four nodes there are six possible two-line failures; the section handles all of them with two bus bars and every node tied to both, plus at least one neighbour. LV222.02 covers the landing pad and a second communication node, two nodes at N−1. HV3k.01 spans the 2 km to the furnace, which takes 3000 V directly and needs no conversion stage at all.

222 V looks arbitrary but is not: it is the battery bank's natural voltage, and matching the grid to it removes a conversion from the section where a conversion would cost the most.

Phase 2 is where the modularity claim gets tested. The reactor lands and produces 400 V AC. It gets its own grid section: rectified to 400 V DC, stepped up by two solid-state transformers to 11 kV for the 3 km run, stepped back down to 3 kV at the far end, and tied into the existing HV3k.01 bus. Nothing already on the surface is modified.

![Phase 2 grid expansion](/assets/images/life-figures/fig-8-26-phase-two-grid-expansion.png)
*Phase 2 expansion: the nuclear plant joins through a new 11 kV DC section and connects to the existing 3 kV bus. The Phase 1 grid is untouched.*

## Wireless power, and why the cable won

Beaming power was the option I most wanted to work. No cable to lay, no trench, no mass on the ground, and terrain becomes irrelevant. With a vacuum and clean line of sight, the Moon is close to the ideal environment for far-field power transmission.

I modelled two systems rather than dismissing the idea on principle. The microwave link was sized with the Friis transmission equation, which relates received power to antenna sizes, wavelength and distance: an 8 m transmitting dish and a 6 m rectenna (a receiving antenna whose elements rectify the radio signal directly to DC) built on gallium nitride diodes at 82% conversion efficiency, evaluated at 2.45 and 5.8 GHz, at about 150 kg per kW of system mass. The laser link uses an aluminium gallium arsenide laser diode at 801 nm aimed at a gallium arsenide photovoltaic receiver tuned to the same wavelength, both ends on 10 m masts to stay above suspended dust, at about 200 kg per kW.

![Received microwave and laser power against transmission distance](/assets/images/life-figures/fig-7-38-received-power-microwave-vs-laser.png)
*Received power against distance for the two microwave frequencies and the laser link. The laser overtakes microwave at around one kilometre and then barely declines, because without an atmosphere there is almost nothing left to weaken the beam.*

That flat laser curve is the striking result, and it is also why the idea fails here. Every Phase 1 user sits inside one kilometre, and inside one kilometre the comparison is an end-to-end efficiency of roughly 26% against a cable that weighs 60 kg and loses 5%. Phase 1 has no power margin to spend on that. Phase 2 has margin but still no distance. So wireless transmission went into the report as a rejected option with the full analysis kept, because the same numbers argue in its favour on any mission where the distances are real.

## Communications

The report assumes LunaNet, NASA's planned network of lunar relay satellites and ground stations, is already operational; this is stated in the project's limitations. Relay satellites, the orbiting Gateway station and the Earth link were therefore out of scope. What I designed was the surface network.

The backbone came almost free. Optical fibre runs in the same trench as the power cable, so every node on the grid picks up a fibre link, and since the grid is already built to N−1 and N−2, the fibre inherits that redundancy without separate design work. For fixed infrastructure, fibre wins on bandwidth, latency and immunity to interference, so the backbone question settled itself.

Anything that moves is harder, and the difficulty is physics rather than engineering. Signal loss over distance grows with the square of frequency, so low frequencies carry further. But channel capacity, by the Shannon–Hartley theorem, scales with bandwidth, and wide bandwidths are only available at high frequencies. Range or throughput: each link picks one.

The solution is the same layering used on Earth. Wi-Fi covers the habitat and about 150 m around it, for tablets, diagnostics and local sensors. Two portable telecom nodes handle everything mobile: a 5 m mast, three phased-array antennas spaced 120° apart for coverage in all directions, gallium nitride amplifiers, and both 4G/LTE and 5G, with a range of roughly 4 km. One node stands at the habitat. The second stands 300 m from the landing pad, far enough to survive a rocket plume and close enough to serve the pad. Each node steps 222 V down to −48 V, the standard supply voltage for telecom hardware, through a small solid-state transformer.

![Side profile of the proposed modular lunar telecommunication node](/assets/images/life-figures/fig-8-33-telecom-node-profile.png)
*The telecom node: a 5 m mast on a stabilised base, carrying a control unit and three directional antennas spaced 120° apart. It provides 4G/LTE and 5G coverage to rovers, astronauts and instruments.*

Phase 2 extends the fibre and adds nodes. The architecture does not change.

## What the report leaves open

The report keeps a list of its own limitations, and my sections carry several. Grid protection and control got a baseline topology, not a design. There is no fatigue analysis of a cable thermally cycling through years of lunar days and nights, no electromagnetic interference modelling, no beam-steering algorithms, no antenna hardware design. The cable masses cover conductor and insulation only; connectors, bus bars and deployment hardware are not included, so the real figure is higher by an amount I cannot state.

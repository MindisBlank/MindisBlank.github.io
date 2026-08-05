---
title: "LIFE: Lunar Infrastructure for Future Exploration"
date: 2025-06-15
summary: "A group project proposing a two-phase lunar base at the equator. I had power transmission and communications: the grid that moves 148 kW from a solar farm to a habitat, a furnace and a landing pad, and the network that shares its trench."
tags: [power systems, communications, space systems, university project]
image: /assets/images/life-figures/fig-8-25-phase-one-grid-topology.png
links:
  - title: "Full report (PDF)"
    url: /assets/docs/life-report.pdf
---

LIFE was a group project: design a permanent lunar base, end to end. Habitat, radiation shielding, ISRU, rovers, landing pad, power, comms.

Most base proposals go for the south pole because of the water ice. We picked the equator instead — more constant sunlight, simpler terrain, and Apollo already went there so there's ground truth to work from. The mission was never about extracting anything profitable. It was about taking a pile of low-TRL technology and running it somewhere real.

I had power transmission and distribution, plus communications. Everyone else either made the electricity or spent it. My end was the wire in between, and the fibre that ended up in the same trench.

## AC or DC

Phase 1 needs 148 kW continuously. The habitat is the origin, the regolith furnace and the landing pad sit 2 km out, and in Phase 2 a 1.5 MW reactor lands 3 km away.

So the first thing to settle was the oldest argument in the field.

DC, and the reasoning is almost embarrassingly simple. The solar array produces DC. The lithium-ion bank charges and discharges DC. Every load we planned runs on DC. An AC grid would mean bolting converters onto both ends of that chain, each throwing away around 10%, to arrive back where you started.

The secondary arguments all point the same way. No skin effect, worth about 2% extra resistance at 60 Hz. No frequency or phase synchronisation, which on Earth soaks up a serious fraction of grid design effort. Less EMI.

There's one more I have no way to prove. Lunar dust carries an electrostatic charge and lofts itself off the surface through the day–night charging cycle. An AC field would sit there alternately attracting and repelling those grains for as long as the line is energised, and I could not find anyone who has measured what that does to adhesion or lofting. It might well be nothing. A DC grid means it stays nothing.

Against all of that: DC has no natural zero crossing, so interrupting a fault is properly harder than in AC. Solid-state circuit breakers are the answer, and terrestrial HVDC has been dragging them forward fast, but this is the weakest part of the choice and I'd say so in a viva.

### Stepping the voltage

Voltage conversion is the one thing AC is genuinely better at, and it's why Tesla won the first time round. A transformer is two coils and an iron core, about as reliable as engineering gets. It also weighs several tonnes, nearly all of it core.

Core cross-section falls off with frequency:

$$A_c = \frac{E_{rms}}{\sqrt{2}\pi f N B_{max}}$$

![Required transformer core cross-section against operating frequency for a 230 V, 300-turn winding at Bmax = 1.2 T](/assets/images/life-figures/fig-7-28-transformer-core-vs-frequency.png)

At 50 Hz the core is enormous. Push into the tens of kHz and it shrinks to something you'd actually put on a rocket.

That's what a solid-state transformer does. Wide-bandgap switches, SiC or GaN, chop the DC into high-frequency AC; a small transformer sets the ratio; a rectifier turns it back into DC. Three times lighter than a 50/60 Hz unit, better than 95% efficient, and it'll push power backwards through itself if you ask. None of it existed during the war of the currents, which is a large part of why the old answer doesn't transfer.

### Picking a conductor

I screened copper, aluminium, calcium, beryllium, magnesium, silver, gold and carbon nanotubes. Criteria were resistivity, density, thermal expansion, radiation tolerance, whether it stays ductile through a lunar night, and whether the regolith contains any.

Calcium nearly won. Best weight-to-resistivity figure on the list, present on the Moon, stays ductile in the cold. Then you remember it oxidises rapidly in air and reacts violently with water, which means the risk isn't operating it, it's getting it off Earth intact. Magnesium died of the same thing.

Beryllium is brittle and toxic, and this is a cable that rovers drive over and astronauts handle near a habitat. Silver and gold are excellent conductors and hopeless payload. Carbon nanotube conductors would be the right answer if anyone could produce kilometres of them, which nobody can.

Aluminium: 2.6 × 10⁻⁸ Ω·m, 2.7 g/cm³, ductile cold, radiation-indifferent, and abundant in the regolith, which at least leaves the door open to making your own conductor on site later.

![Cable mass against transmission distance for various conductor materials at 1 MW and 11 kV with a 5% loss limit](/assets/images/life-figures/fig-7-30-cable-mass-by-conductor-material.png)

Three layers go over the conductor. Kapton for insulation at 272 kV/mm, picked over PTFE and silicone rubber because both of those degrade under radiation. Kapton's weakness is abrasion, and lunar dust is abrasive more or less by definition, so it gets a 0.1 mm boron nitride nano-coating on top. Outside that, a 1 mm braided aluminium mesh for mechanical protection — same principle as a braided plumbing hose, and it keeps the cable flexible enough to wind onto a spool.

Sizing conductor radius to a 5% loss limit, with a safety factor of 5 on the insulation, the masses came out lower than I expected. 100 m carrying 155 kW at 222 V is about 60 kg. 3 km carrying 1.575 MW at 11 kV is about 360 kg. Each spool gets cut to length and marked for its specific run before launch, so nobody is measuring and cutting cable in a pressure suit.

## Grid layout

Three sections in Phase 1: two low-voltage zones at 222 V and one 3 kV link joining them, each hung off aluminium bus bars.

![Proposed Phase 1 grid topology showing two low-voltage zones and one high-voltage transmission segment](/assets/images/life-figures/fig-8-25-phase-one-grid-topology.png)

LV222.01 carries the batteries, solar farm, habitat and comms. People live on it, so it's built to N−2. Four nodes gives six two-point contingencies; the fix is two bus bars with every node tied to both plus at least one neighbour. LV222.02 is the landing pad and more comms, two nodes, N−1. HV3k.01 spans the 2 km and feeds the furnace, which takes 3000 V straight in and so needs no conversion stage at all.

222 V looks arbitrary. It's the battery bank's natural voltage, and matching the grid to it removes a conversion from the section where a conversion would hurt most.

Phase 2 was the real test of whether "modular" meant anything or was just a word in the abstract. The reactor lands, puts out 400 V AC, and gets its own section: rectify to 400 V DC, two SSTs up to 11 kV for the 3 km haul, two more back down to 3 kV at the far end, tie into the existing HV3k.01 bus. Nothing already on the surface gets touched.

![Phase 2 grid expansion integrating the nuclear plant via an 11 kV DC section](/assets/images/life-figures/fig-8-26-phase-two-grid-expansion.png)

## Wireless power, and why it lost

This is the part I wanted to work.

No cable to lay, no trench, no mass sitting on the ground; just beam the power over terrain a rover would hate, through a vacuum, with clean line of sight and no weather. On paper the Moon is about the best place in the solar system to try far-field power transfer.

Two candidates, both modelled properly rather than hand-waved. Microwave: Friis link budget, 8 m transmit dish and 6 m rectenna, run at 2.45 and 5.8 GHz, GaN Schottky rectennas at 82% RF-to-DC, 150 kg/kW for the complete system. Laser: AlGaAs diode at 801 nm into a GaAs receiver tuned to the same wavelength, both ends up 10 m masts to stay clear of suspended dust, 200 kg/kW.

![Received microwave and laser power against transmission distance](/assets/images/life-figures/fig-7-38-received-power-microwave-vs-laser.png)

The laser link overtakes microwave at around a kilometre and then goes flat, because without an atmosphere the distance term more or less stops mattering. Which turns out to be the problem, not the win. Every user in Phase 1 sits inside that kilometre, and inside a kilometre you're comparing a 26% end-to-end link against a cable that weighs 60 kg. Phase 1 has no power margin to spend. Phase 2 has margin and still no distance.

So it went into the report as a rejected option with all the working left in.

## Communications

LunaNet is assumed operational — that's stated up front in the project's limitations — so relay satellites, Gateway and the Earth link weren't mine. Surface network only.

One result came for free. The fibre runs in the same trench as the power cable, so every node on the grid picks up an optical link, and because the grid is already built to N−1 and N−2 the fibre inherits that redundancy without anyone designing for it. For fixed infrastructure fibre wins on bandwidth, latency and interference immunity, so the backbone question answered itself.

Anything that moves is harder. Free-space path loss goes with frequency squared, but Shannon-Hartley puts your capacity in the bandwidth, and the bandwidth lives up at high frequency. Range or throughput, pick one.

Layering is how Earth gets around that, so that's what we did. Wi-Fi in and immediately around the habitat, 150 m, for tablets and diagnostics. Two portable telecom nodes handle everything mobile: 5 m mast, three phased-array antennas at 120° for near-isotropic coverage, GaN solid-state amplifiers, 4G/LTE and 5G, roughly 4 km reach. One sits at the habitat. The second is 300 m back from the landing pad, far enough to survive a plume and close enough to run the pad. Each node takes 222 V down to −48 V through an SST, since −48 V is what telecom hardware expects anyway.

![Side profile of the proposed modular lunar telecommunication node](/assets/images/life-figures/fig-8-33-telecom-node-profile.png)

Phase 2 adds fibre and adds nodes. The architecture doesn't change.

## What isn't in here

Worth naming the gaps, since the report names them too. No grid protection or control design past a baseline topology. No mechanical fatigue analysis on cable that thermal-cycles through the full lunar day and night for years. No EMI modelling, no beam-steering algorithms, no antenna hardware.

The cable masses are conductor-plus-insulation only. No connectors, no bus bar mass, no deployment hardware. The real number is higher and I don't know by how much.

If I did it again I'd start at fault protection rather than leaving it as a topology sketch. It's the one place where a lunar DC grid genuinely differs from a terrestrial one, and it's the part I have least to show for.

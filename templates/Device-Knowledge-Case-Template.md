# Device Knowledge Case

Use this template whenever a device problem, its cause, or its fix is worth keeping. Write in plain operational language: another technician who has never seen the incident should be able to repeat your result.

Fill every section. If one does not apply, write "Not applicable" and say why in one line.

---

## 1. Case summary

One or two sentences that say what went wrong and how it was fixed. This is what appears in search results, so lead with the symptom, not the internal reference.

> Example: Receipt printer stops mid-print at three checkouts; resolved by replacing the power adapter and resetting the spooler.

## 2. Device affected

Describe the machine as it is physically labelled, so someone can stand in front of the right one.

| Item | Detail |
|---|---|
| Device name / asset label | |
| Category | POS, printer, display, scanner, laptop, server, network gear, other |
| Manufacturer | |
| Model | |
| Serial or asset number | |
| Firmware / driver version | |
| Operating system and version | |
| Location | site, floor, department, room |

## 3. Environment and scope

Where the problem lives and how far it spreads.

- Single device, one site, or every installation?
- Connected setup: cable, Wi-Fi, dock, peripheral chain, shared service.
- Recent changes in that environment: new software, new hardware, update, relocation, power work.
- Anything unusual about this location that a technician would not know.

## 4. Symptoms observed

What a person actually sees, hears, or feels. Quote the exact wording of any message on screen.

- Message or code shown to the user
- Sounds, lights, error LEDs, physical behaviour
- What is normal before and after the symptom appears
- Screenshots or photos attached to the case

## 5. Impact and urgency

Who is blocked and for how long, so the priority is obvious to whoever picks it up.

- Users, roles, or services affected
- Business effect: queue length, transactions, downtime minutes
- Workaround available in the meantime: yes / no, and what it costs
- Severity: critical, high, medium, low, with the reason

## 6. When it happens and how to reproduce

Steps in order, written so someone else can trigger the same result on purpose.

1.
2.
3.

- Timing: constant, random, only at open, only after standby, only under load.
- How often it repeats out of ten attempts.
- Whether it follows another action.

## 7. Diagnosis steps

What was checked, in the order it was checked, including the branches that turned out to be dead ends. Dead ends are valuable: they stop the next technician repeating them.

| # | What was checked | Expected | Actual | Led to next step? |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |

Record the readings, logs, or tests that finally pointed at the cause.

## 8. Root cause

The underlying reason, stated once in plain terms. Separate it from the symptom: "the cable was loose" is a symptom of a badly routed loom.

- Confirmed or suspected
- Evidence that proves it
- Whether the same cause could exist on other devices

## 9. Resolution applied

The permanent fix, step by step, with everything needed before starting.

- Parts used, including model numbers and quantities
- Tools, access, or permissions needed
- Settings changed, before and after
- Roughly how long it took
- Whether the device stayed in service during the fix

If only a workaround exists, say so here and repeat it in section 11.

## 10. Verification

How you proved the problem is actually gone, and to whom you proved it.

- Test performed and its result
- Who confirmed it (user, supervisor, vendor)
- How long the device was watched afterwards
- Whether the original reproduction steps still trigger the symptom

## 11. Prevention and follow-up

What should change so this case does not come back.

- Maintenance, spare stock, or inspection to add
- Other devices or sites that should be checked for the same cause
- Training, labelling, or documentation to update
- Open items with an owner and a date
- Related cases worth linking from here

---

## Writing rules

- Present tense, active voice, one instruction per sentence.
- Exact names: the label on the machine, not "the printer".
- Numbers, not adjectives: "12 minutes", not "a while".
- Never record customer data, staff names, passwords, or network credentials.
- Attach photos of the fault, not of the desk.
- If a step is dangerous or needs a second person, say so before the step.

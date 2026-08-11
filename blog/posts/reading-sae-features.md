Sparse autoencoders give us something that feels like a microscope for language
models: thousands of latents, each with a dashboard of top-activating examples
that often reads as a clean, nameable concept. The feeling of understanding is
strong. That feeling is exactly the problem.

This post collects the failure modes I keep running into when interpreting SAE
features, and the cheap checks that catch each one. None of this is novel — most
of it is folklore that circulates in conversation but rarely gets written down.

## The dashboard is a biased sample

The standard feature dashboard shows the top-*k* activating examples. That is,
by construction, the part of the distribution where the feature is most
confident. If you name a feature from its top 20 examples, you are naming the
mode, not the feature.

Interpretability work built on dictionary learning has been aware of this since
the early monosemanticity results [^bricken], but the shortcut is easy to take
under deadline pressure.

The fix is cheap: **stratify by activation strength**. Sample examples from the
50th, 75th, 90th, and 99th percentiles of the nonzero activation distribution.
A feature whose description survives all four strata is a feature you can
actually name. In my experience, roughly a third do not survive.

> If your interpretation only holds at the 99th percentile, you have described
> the top of a distribution, not a mechanism.

## Interpretability is not causality

A latent that activates on text about the Golden Gate Bridge is not thereby a
latent that *causes* the model to talk about the Golden Gate Bridge. These come
apart more often than the dashboards suggest.

The check is to intervene. Ablate the feature and measure the change in loss on
examples where it fires; clamp it to a high value and check whether generation
shifts in the direction the label predicts. Feature steering results
[^templeton] set a useful bar here: a label worth trusting should survive being
used as a control knob.

Concretely, the checks I run before believing a feature label:

1. **Stratified examples** — does the description hold below the top percentile?
2. **Ablation** — does removing it change behaviour on the examples it fires on?
3. **Steering** — does amplifying it move generation the way the label predicts?
4. **Negative set** — can I find text matching the label where it stays silent?

Step 4 is the one people skip, and it is the one that most often kills a
description.

## Splitting is not a bug, but it is a confound

Train a wider SAE and yesterday's single feature becomes today's five. This
feature splitting is well documented, and it is not in itself a problem — the
finer features are usually genuinely finer.

It becomes a problem when you compare results across dictionary sizes without
saying so. "Feature 4021 encodes *X*" is a claim about a specific SAE at a
specific width trained on a specific layer, and it does not transport. Any claim
about features should carry that provenance the way an experimental result
carries its hyperparameters.

This is part of what motivated my own work on hierarchical structure in SAEs:
if splitting is real and systematic, the dictionary should represent the
hierarchy explicitly rather than leaving it implicit in the choice of width.

## What I actually do now

My working checklist, in the order I run it:

- Pull stratified examples before writing any description.
- Write the description as a *falsifiable* claim, then look for the counterexample.
- Run ablation and steering before the description leaves my notes.
- Record layer, SAE width, sparsity coefficient, and training data alongside the
  feature ID — always.

None of this is expensive. It is maybe twenty minutes per feature, against the
several hours it costs to build an argument on a description that turns out to
be wrong.

## Conclusion

The uncomfortable thing about SAE features is that a wrong interpretation and a
right one feel identical from the dashboard. The only difference is whether you
went looking for the evidence that would have changed your mind. Most of the
work of interpretability is building the habit of looking.

[^bricken]: Bricken, T., et al. (2023). *Towards Monosemanticity: Decomposing Language Models With Dictionary Learning*. Transformer Circuits Thread. [Read](https://transformer-circuits.pub/2023/monosemantic-features)
[^templeton]: Templeton, A., et al. (2024). *Scaling Monosemanticity: Extracting Interpretable Features from Claude 3 Sonnet*. Transformer Circuits Thread. [Read](https://transformer-circuits.pub/2024/scaling-monosemanticity/)

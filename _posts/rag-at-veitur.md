---
title: "My attempt at deploying a RAG model and what I learnt"
date: 2025-08-07
---

# My attempt at deploying a RAG model and what I learnt

How deep should this trench be? What kind of sand goes over a high voltage line?

I spent a good part of last summer not knowing the answer to questions like these. I was interning at Veitur, covering for a project manager so he could take his vacation without the whole project stopping for three weeks. The job was budget approvals, chasing permits, showing up to meetings. Most of it I could figure out. But every few days something like the trench question would land on me and I had no idea.

So I would walk around the office and ask whoever looked least busy. The answer was always the same: "Oh, that's standardised, it's in the document." Then someone would send me a PDF. A hundred and forty pages of it. And the thing I needed was on page 61, in one table, in a sentence I would have to read twice.

That happened enough times that I started thinking about it as a problem rather than as me being new.

## Finding the right shape of the problem

I knew from school that LLMs are good at exactly this: you have a question in normal human language, the answer exists somewhere in a pile of text, go find it and explain it. The part I did not know was how to connect a model to a knowledge base it had never seen.

That turned out to have a name. Retrieval-augmented generation. Instead of relying only on what the model learned during training, the system first searches an external source for passages relevant to your question, then hands those passages to the model along with your question. The model answers from the retrieved text rather than from memory. You get answers that are specific to your documents, and you get citations, which matters a lot when the answer decides how deep someone digs.

I built a small prototype to see if the idea held up. Pinecone for the vector database, Gemini's API as the model, everything running in my terminal against the public documents on Veitur's website. It worked. Not perfectly, but well enough that I stopped wondering whether it was possible.

## Getting permission to use the real data

The prototype only had public data, and the useful stuff is not public. Veitur keeps almost everything in SharePoint: emails, drawings, contracts, regulations, project histories going back years. If a system could search all of that, it would not just help me. New employees spend their first months learning where things are, and every project has its own timeline, budget and set of oddities that someone has already written down somewhere.

To get at that I needed permission. Fortunately Veitur employs a person with the best job title I have ever encountered: AI Architect. I explained the idea, she liked it, and I got access to their Azure environment with two conditions.

First, the code had to be easy to maintain after I left. That ruled out writing a system from scratch. Second, the tool could only be available to employees who already had access to everything in it, which is a small group.

Both conditions were reasonable. Both of them are also, in hindsight, where the project ran into trouble.

## The stack

![Tech stack diagram for the RAG system](/assets/images/RAG/Rag_diagram.png)

Data went into Azure Blob Storage. The person responsible for the database was on holiday for most of the summer, which is what an Icelandic summer does to a project, so I wrote a PowerShell script to copy everything I had access to into a fresh blob container. The plan was to swap it for the real thing when he came back.

Text was vectorised through an Azure AI Services resource and indexed with Azure AI Search. Image vectorisation cost more than I could justify, so instead I ran every image in every PDF through GPT-4o mini and had it write a text description, which the search index could then treat like any other passage. Cheap trick, worked better than I expected.

For the part the user actually talks to, I used Copilot with GPT-4o, and later a Microsoft Teams agent.

## What worked and what did not

Azure AI Search was the best part by a distance. Retrieval quality beat my Pinecone prototype by a wide margin, and I did not have to tune much to get there. I only tested it informally, asking questions I already knew the answers to, but it kept finding the right page.

The front end is where it fell apart, and the reason is the first constraint. Easy to maintain meant Microsoft's prebuilt chat surfaces, and those were not ready.

Copilot was tolerable. It would sometimes get stuck in a loop and stop responding, and I could not share it with anyone else, which makes it useless as a company tool. Its citations pointed at the PDF, not the page, so you were back to scrolling through 140 pages.

The Teams agent was worse. I could share it, which was the whole point of switching, but almost nothing else worked. It could not use the image descriptions. It could not use the skills I had written against the search index. It dropped its connection at random. It only ran GPT-4o with no option to change. Its links pointed at raw blob storage instead of SharePoint, so the permission model I had been careful about was gone. And it did not understand Icelandic. Everything it retrieved was in Icelandic, so it was reasoning over text it could not read.

Near the end I tested the same index against o1 with a small custom front end. It was better in every way that mattered, and it could link to a specific page inside SharePoint, which preserved access control. That confirmed the retrieval layer was fine and the problem was everything sitting on top of it.

## What I learnt

The model at the front matters as much as the retrieval behind it. A weak model on a good index gives you a bad product, and users cannot tell the difference between the two.

The bigger lesson was about deployment. I showed the tool to colleagues while telling them it was a work in progress, and I might as well have said nothing. People with full schedules do not run beta tests for you. A tool works or it does not, and if it fails the first time they touch it, it joins the pile of AI things that were more hassle than help. I only get one first impression per person, and I spent mine on a Teams agent that could not read Icelandic.

This was a feasibility study, and as a feasibility study it succeeded. I handed over the code, but the lessons were the more useful output. Veitur wants an agent that behaves like a knowledgeable colleague, one that helps people find information, understand it, and eventually support decisions on projects. Now there is a clearer picture of which parts of that are solved and which are not.
---
layout: page
title: About
permalink: /about/
---

<div class="about-header">
  <img class="about-photo" src="{{ '/assets/images/me.jpg' | relative_url }}" alt="Photo of {{ site.author.name }}">
  <div>
    <p>Hi, I'm {{ site.author.name }}. Replace this with a short introduction —
    who you are, what you work on, and what you like sharing here.</p>
    <div class="about-links">
      {% if site.social.github %}<a href="{{ site.social.github }}">GitHub</a>{% endif %}
      {% if site.social.linkedin %}<a href="{{ site.social.linkedin }}">LinkedIn</a>{% endif %}
      <a href="{{ site.cv | relative_url }}">CV (PDF)</a>
    </div>
  </div>
</div>

Longer bio goes here. Write as much or as little as you want — this page
is regular markdown, so add headings, lists, or images freely.

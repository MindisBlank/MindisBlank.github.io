---
layout: page
title: About
permalink: /about/
---

<div class="about-header">
  <img class="about-photo" src="{{ '/assets/images/me.jpg' | relative_url }}" alt="Photo of {{ site.author.name }}">
  <div>
    <p>My name is Jason, and I am an electrical engineer from Iceland planning to move to Stockholm. I created this website to share my interests and showcase my past projects. </p>
    <div class="about-links">
      {% if site.social.github %}<a href="{{ site.social.github }}">GitHub</a>{% endif %}
      {% if site.social.linkedin %}<a href="{{ site.social.linkedin }}">LinkedIn</a>{% endif %}
      <a href="{{ site.cv | relative_url }}">CV (PDF)</a>
    </div>
  </div>
</div>


---
layout: page
title: About
permalink: /about/
---

<div class="about-header">
  <img class="about-photo" src="{{ '/assets/images/me.jpg' | relative_url }}" alt="Photo of {{ site.author.name }}">
  <div>
    <p>My name is Jason, and I am an electrical engineer from Iceland, now living in Stockholm. I created this website to share my interests and showcase my past projects. </p>
    <div class="about-links">
      {% if site.social.github %}<a href="{{ site.social.github }}">GitHub</a>{% endif %}
      {% if site.social.linkedin %}<a href="{{ site.social.linkedin }}">LinkedIn</a>{% endif %}
      <a href="{{ site.cv | relative_url }}">CV (PDF)</a>
    </div>
  </div>
</div>

<section class="travel">
  <h2>Where I've been</h2>
  <p>The ochre line traces the places I've called home; the blue threads are trips out of each home base. Hover or tap a trip below to find it on the map.</p>
  <div class="travel-map-wrap">
    <div class="travel-map-scroll">
      {% include world-map.svg %}
    </div>
    <div class="travel-caption">
      <p><strong>16 countries</strong> · 4 continents · 3 moves</p>
      <button id="travel-replay" type="button" hidden>Replay journey</button>
    </div>
  </div>
  <div class="travel-lists">
    <div class="travel-era">
      <h3>From Boston <span>until 2008</span></h3>
      <ul>
        <li data-trip="toronto">Toronto</li>
        <li data-trip="philadelphia">Philadelphia</li>
        <li data-trip="nyc">New York City</li>
        <li data-trip="colorado">Colorado</li>
      </ul>
    </div>
    <div class="travel-era">
      <h3>From Reykjavík <span>2008–2023</span></h3>
      <ul>
        <li data-trip="berlin">Berlin</li>
        <li data-trip="prague">Prague</li>
        <li data-trip="copenhagen">Copenhagen</li>
        <li data-trip="london">London</li>
        <li data-trip="alicante">Alicante</li>
        <li data-trip="portugal">Lisbon · Lagos</li>
        <li data-trip="italy">Milan · Venice · Bologna · Florence · Rome · Naples · Catania · Palermo</li>
        <li data-trip="japan">Tokyo · Kyoto · Osaka · Nice</li>
      </ul>
    </div>
    <div class="travel-era">
      <h3>From Copenhagen <span>2024–2026</span></h3>
      <ul>
        <li data-trip="poland">Gdańsk · Warsaw</li>
        <li data-trip="tallinn">Tallinn</li>
        <li data-trip="marrakesh">Marrakesh</li>
        <li data-trip="tampa">Tampa</li>
      </ul>
    </div>
    <div class="travel-era">
      <h3>From Stockholm <span>2026 –</span></h3>
      <ul>
        <li class="travel-empty">Nothing yet — just landed.</li>
      </ul>
    </div>
  </div>
</section>

<script src="{{ '/assets/js/travel-map.js' | relative_url }}" defer></script>


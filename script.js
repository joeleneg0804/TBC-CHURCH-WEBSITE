// Keep page content clear of the fixed header, whatever height it ends up
// being (it can wrap onto more lines on narrow screens).
function syncHeaderOffset() {
  var header = document.querySelector("header");
  if (header) {
    document.body.style.paddingTop = header.offsetHeight + "px";
  }
}
window.addEventListener("load", syncHeaderOffset);
window.addEventListener("resize", syncHeaderOffset);

var yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// Nav dropdown (e.g. Gallery): tap-to-open on touch devices, hover on desktop.
document.querySelectorAll(".nav-dropdown > a").forEach(function (link) {
  link.addEventListener("click", function (e) {
    var li = link.parentElement;
    var isTouch = window.matchMedia("(hover: none)").matches;
    if (isTouch && !li.classList.contains("open")) {
      e.preventDefault();
      document.querySelectorAll(".nav-dropdown.open").forEach(function (open) {
        if (open !== li) {
          open.classList.remove("open");
        }
      });
      li.classList.add("open");
    }
  });
});

document.addEventListener("click", function (e) {
  document.querySelectorAll(".nav-dropdown.open").forEach(function (li) {
    if (!li.contains(e.target)) {
      li.classList.remove("open");
    }
  });
});

// Contact form: send via FormSubmit (emails the message) without leaving the page.
var contactForm = document.getElementById("contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var status = document.getElementById("form-status");
    var btn = contactForm.querySelector("button[type=submit]");
    status.className = "";
    status.textContent = "Sending...";
    btn.disabled = true;
    var url = contactForm.action.replace("formsubmit.co/", "formsubmit.co/ajax/");
    fetch(url, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new FormData(contactForm)
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.success === "true" || d.success === true) {
          contactForm.reset();
          status.className = "form-success";
          status.textContent = "Thank you! Your message has been sent. We will be in touch soon.";
        } else {
          throw new Error("failed");
        }
      })
      .catch(function () {
        status.className = "form-error";
        status.textContent = "Sorry, your message could not be sent. Please email us at tongaatbaptistchurch@gmail.com.";
      })
      .then(function () { btn.disabled = false; });
  });
}

// Gallery: click-to-enlarge lightbox.
(function () {
  var photos = Array.prototype.slice.call(document.querySelectorAll(".photo-collage .collage-photo"));
  if (!photos.length) return;

  // ---- Click to enlarge ----
  var items = photos.map(function (p) {
    var fg = p.querySelector(".collage-fg");
    return { src: fg.getAttribute("src"), alt: fg.getAttribute("alt") || "" };
  });

  var box = document.createElement("div");
  box.className = "lightbox";
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-label", "Photo viewer");
  box.hidden = true;
  box.innerHTML =
    '<button type="button" class="lb-btn lb-close" aria-label="Close">&times;</button>' +
    '<button type="button" class="lb-btn lb-prev" aria-label="Previous photo">&#10094;</button>' +
    '<figure class="lb-figure"><img class="lb-img" alt="" /><figcaption class="lb-count"></figcaption></figure>' +
    '<button type="button" class="lb-btn lb-next" aria-label="Next photo">&#10095;</button>';
  document.body.appendChild(box);

  var img = box.querySelector(".lb-img");
  var count = box.querySelector(".lb-count");
  var current = 0;
  var lastFocus = null;

  function show(i) {
    current = (i + items.length) % items.length;
    img.src = items[current].src;
    img.alt = items[current].alt;
    count.textContent = (current + 1) + " / " + items.length;
  }
  function open(i) {
    lastFocus = document.activeElement;
    show(i);
    box.hidden = false;
    requestAnimationFrame(function () { box.classList.add("open"); });
    document.body.classList.add("lb-lock");
    box.querySelector(".lb-close").focus();
  }
  function close() {
    box.classList.remove("open");
    document.body.classList.remove("lb-lock");
    setTimeout(function () { box.hidden = true; }, 200);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  photos.forEach(function (p, i) {
    p.classList.add("zoomable");
    p.setAttribute("tabindex", "0");
    p.setAttribute("role", "button");
    p.setAttribute("aria-label", "Enlarge photo " + (i + 1) + " of " + photos.length);
    p.addEventListener("click", function () { open(i); });
    p.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(i); }
    });
  });

  box.querySelector(".lb-close").addEventListener("click", close);
  box.querySelector(".lb-prev").addEventListener("click", function () { show(current - 1); });
  box.querySelector(".lb-next").addEventListener("click", function () { show(current + 1); });
  box.addEventListener("click", function (e) {
    if (e.target === box || e.target.classList.contains("lb-figure")) close();
  });
  document.addEventListener("keydown", function (e) {
    if (box.hidden) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft") show(current - 1);
    else if (e.key === "ArrowRight") show(current + 1);
  });

  // Swipe left/right on touch screens
  var startX = null;
  box.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
  box.addEventListener("touchend", function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    startX = null;
  });
})();

/* AI Verse apps, desktop look (see desktop.css). Marks the page so the light desktop design applies on wide
   screens, and puts a greeting with today's date in the top bar. Phones keep the mobile layout. */
(function(){
  var d = document.documentElement;
  var m = location.pathname.match(/(ai-[a-z-]+?)(?:\.desktop)?\.html$/);
  d.setAttribute("data-aivd", m ? m[1] : "");
  var mq = matchMedia("(min-width: 900px)");
  function apply(){ d.classList.toggle("aivd", mq.matches); }
  apply();
  try{ mq.addEventListener("change", apply); }catch(e){ mq.addListener(apply); }

  function hello(){
    var top = document.querySelector(".shell > header.top");
    if(!top || top.querySelector(".aivd-hello")) return;
    var h = new Date().getHours();
    var el = document.createElement("div");
    el.className = "aivd-hello";
    var b = document.createElement("b");
    b.textContent = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    var s = document.createElement("span");
    s.textContent = new Date().toLocaleDateString(undefined, { weekday:"long", month:"long", day:"numeric" });
    el.appendChild(b); el.appendChild(s);
    var r = top.querySelector(".hdr-r");
    if(r) top.insertBefore(el, r); else top.appendChild(el);
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", hello); else hello();
})();

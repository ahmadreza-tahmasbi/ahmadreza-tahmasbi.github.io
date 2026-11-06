(function(){
  // Contact form endpoint (e.g. https://formspree.io/f/xxxxxxx). Leave empty to keep the form hidden.
  var FORM_ENDPOINT='';
  var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine=matchMedia('(hover: hover) and (pointer: fine)').matches;
  var root=document.documentElement;
  function $(id){return document.getElementById(id);}
  function css(n){return getComputedStyle(root).getPropertyValue(n).trim();}

  // mobile menu
  var mb=$('menu-btn'),hdr=document.querySelector('header.top');
  if(mb&&hdr){
    function setMenu(open){hdr.classList.toggle('open',open);mb.setAttribute('aria-expanded',open?'true':'false');}
    mb.addEventListener('click',function(){setMenu(!hdr.classList.contains('open'));});
    document.querySelectorAll('nav.links a').forEach(function(a){a.addEventListener('click',function(){setMenu(false);});});
    document.addEventListener('keydown',function(e){if(e.key==='Escape')setMenu(false);});
  }

  // copy email
  var btn=$('copy'), mail=$('mail');
  if(btn&&mail){btn.addEventListener('click',function(){
    var t=mail.textContent.trim();
    function sel(){var r=document.createRange();r.selectNodeContents(mail);var s=getSelection();s.removeAllRanges();s.addRange(r);btn.textContent='Selected';}
    try{navigator.clipboard.writeText(t).then(function(){btn.textContent='Copied';},sel);}catch(e){sel();}
    setTimeout(function(){btn.textContent='Copy email';},1800);
  });}

  var form=document.getElementById('cform');
  if(form&&FORM_ENDPOINT){
    form.hidden=false;
    var st=document.getElementById('cf-status');
    form.addEventListener('submit',function(e){e.preventDefault();
      var n=form.querySelector('#cf-name'),em=form.querySelector('#cf-email'),m=form.querySelector('#cf-msg');
      if(!n.value.trim()||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em.value)||!m.value.trim()){st.textContent='Add your name, a valid email and a message.';return;}
      st.textContent='Sending…';
      fetch(FORM_ENDPOINT,{method:'POST',headers:{'Accept':'application/json','Content-Type':'application/json'},body:JSON.stringify({name:n.value,email:em.value,message:m.value})})
        .then(function(r){if(!r.ok)throw 0;form.reset();st.textContent='Sent. I will reply by email.';})
        .catch(function(){st.textContent='Could not send. Please email me directly.';});
    });
  }

  // gear outline generator (trapezoidal teeth)
  function gear(n,ro,ri,hole,cx,cy){cx=cx||0;cy=cy||0;var d='',s=Math.PI/n;
    for(var i=0;i<n;i++){var a=i*2*s,p=[[ri,a-.62*s],[ro,a-.36*s],[ro,a+.36*s],[ri,a+.62*s]];
      p.forEach(function(q,j){d+=(i===0&&j===0?'M':'L')+(cx+q[0]*Math.cos(q[1])).toFixed(2)+' '+(cy+q[0]*Math.sin(q[1])).toFixed(2);});}
    d+='Z';
    if(hole)d+=' M'+(cx+hole)+' '+cy+' A'+hole+' '+hole+' 0 1 0 '+(cx-hole)+' '+cy+' A'+hole+' '+hole+' 0 1 0 '+(cx+hole)+' '+cy+'Z';
    return d;}
  var hg=$('hgear'); if(hg)hg.setAttribute('d',gear(40,210,187.5,0,300,300));
  var g1=$('g1'),g2=$('g2');
  if(g1&&g2){g1.setAttribute('d',gear(12,12,9.6,3.2));g2.setAttribute('d',gear(8,8.2,6,2.2));
    g1.setAttribute('transform','translate(12.5 13)');g2.setAttribute('transform','translate(30.4 13) rotate(22.5)');}

  // ambience: page-wide grid lights up around the pointer
  if(fine&&!reduce){
    var cx=0,cy=0,p1=false;
    addEventListener('pointermove',function(e){cx=e.clientX;cy=e.clientY;root.classList.add('pointer');
      if(!p1){p1=true;requestAnimationFrame(function(){p1=false;root.style.setProperty('--cx',cx+'px');root.style.setProperty('--cy',cy+'px');});}},{passive:true});
    document.addEventListener('pointerleave',function(){root.classList.remove('pointer');});
  }


  // Display headings: letters start light and thicken as the pointer comes near
  (function(){
    var heads=[].slice.call(document.querySelectorAll('.hero h1, .sec-title, .contact-block .lead h2'));
    if(!heads.length||!fine||reduce)return;
    var BASE=300,MAX=880,groups=[];
    heads.forEach(function(h){
      var letters=[];
      h.setAttribute('aria-label',h.textContent.replace(/\s+/g,' ').trim());
      (function walk(node){
        [].slice.call(node.childNodes).forEach(function(c){
          if(c.nodeType===3){
            var frag=document.createDocumentFragment();
            c.textContent.split(/(\s+)/).forEach(function(part){
              if(!part)return;
              if(/^\s+$/.test(part)){frag.appendChild(document.createTextNode(part));return;}
              var w=document.createElement('span');w.className='w';w.setAttribute('aria-hidden','true');
              for(var i=0;i<part.length;i++){var ch=document.createElement('span');ch.className='ch';ch.textContent=part.charAt(i);w.appendChild(ch);letters.push(ch);}
              frag.appendChild(w);
            });
            node.replaceChild(frag,c);
          } else if(c.nodeType===1){walk(c);}
        });
      })(h);
      h.classList.add('vf');
      groups.push({h:h,R:h.closest('.hero')?300:230,letters:letters,dirty:false});
    });
    root.classList.add('vf-on');
    var px=-1e4,py=-1e4,raf=0;
    function frame(){
      raf=0;var vh=innerHeight,jobs=[];
      // read every position first, then write, so layout runs once per frame
      groups.forEach(function(g){
        var r=g.h.getBoundingClientRect();
        var near=r.bottom>-g.R&&r.top<vh+g.R&&py>r.top-g.R&&py<r.bottom+g.R&&px>r.left-g.R&&px<r.right+g.R;
        if(!near){if(g.dirty)jobs.push({g:g,c:null});return;}
        jobs.push({g:g,c:g.letters.map(function(s){var b=s.getBoundingClientRect();return [b.left+b.width/2,b.top+b.height/2];})});
      });
      jobs.forEach(function(j){
        var g=j.g,any=false;
        g.letters.forEach(function(s,i){
          var a=j.c?Math.max(0,1-Math.hypot(px-j.c[i][0],py-j.c[i][1])/g.R):0;
          if(a>0){s.style.fontWeight=String(Math.round(BASE+(MAX-BASE)*a*a));any=true;}
          else if(s.style.fontWeight){s.style.fontWeight='';}
        });
        g.dirty=any;
      });
    }
    function ask(){if(!raf)raf=requestAnimationFrame(frame);}
    addEventListener('pointermove',function(e){px=e.clientX;py=e.clientY;ask();},{passive:true});
    addEventListener('scroll',ask,{passive:true});
    document.addEventListener('pointerleave',function(){px=py=-1e4;ask();});
    addEventListener('blur',function(){px=py=-1e4;ask();});
  })();

  // hero CAD crosshair with live coordinates (mm at 96 dpi)
  var hero=$('hero'),xhl=$('xhl');
  if(hero&&xhl&&fine&&!reduce){
    var mx=0,my=0,p2=false;
    function paint(){p2=false;hero.style.setProperty('--mx',mx+'px');hero.style.setProperty('--my',my+'px');
      xhl.textContent='X '+(mx/3.7795).toFixed(1).padStart(5,'0')+'  Y '+(my/3.7795).toFixed(1).padStart(5,'0')+' mm';}
    hero.addEventListener('pointermove',function(e){var r=hero.getBoundingClientRect();mx=e.clientX-r.left;my=e.clientY-r.top;hero.classList.add('on');if(!p2){p2=true;requestAnimationFrame(paint);}});
    hero.addEventListener('pointerleave',function(){hero.classList.remove('on');});
  }
  // magnetic buttons
  if(fine&&!reduce){document.querySelectorAll('.btn').forEach(function(b){
    b.addEventListener('pointermove',function(e){var r=b.getBoundingClientRect();b.style.transform='translate('+((e.clientX-r.left-r.width/2)*.18).toFixed(1)+'px,'+((e.clientY-r.top-r.height/2)*.28).toFixed(1)+'px)';});
    b.addEventListener('pointerleave',function(){b.style.transform='';});
  });}

  // scroll progress + active section in the nav
  var prog=$('progress'),pt=false;
  function setProg(){pt=false;var max=root.scrollHeight-root.clientHeight;if(prog)prog.style.transform='scaleX('+(max>0?scrollY/max:0)+')';}
  addEventListener('scroll',function(){if(!pt){pt=true;requestAnimationFrame(setProg);}},{passive:true});setProg();
  var links={};document.querySelectorAll('nav.links a').forEach(function(a){var h=a.getAttribute('href');var k=h.split('#')[1];if(k&&h.charAt(0)==='#')links[k]=a;});
  if('IntersectionObserver' in window&&Object.keys(links).length){
    var so=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){Object.keys(links).forEach(function(k){links[k].removeAttribute('aria-current');});var l=links[e.target.id];if(l)l.setAttribute('aria-current','true');}});},{rootMargin:'-45% 0px -50% 0px'});
    document.querySelectorAll('section.block').forEach(function(sec){so.observe(sec);});
  }

  // toolpath plate (Diamond 45° raster)
  var cv=$('bed'), dro=$('dro');
  if(!cv)return;
  var ctx=cv.getContext('2d');
  var W=0,H=0,paths=[],total=0,dist=0,last=0,raf=0,pad=18,started=false,bead=8;
  function layer(dir,w,h,s){
    var pts=[],k=0,c,x0,x1,a,b,cs=[];
    if(dir>0){for(c=-w;c<=h;c+=s)cs.push(c);} else {for(c=0;c<=w+h;c+=s)cs.push(c);}
    cs.forEach(function(c){
      if(dir>0){x0=Math.max(0,-c);x1=Math.min(w,h-c);a=[x0,x0+c];b=[x1,x1+c];}
      else{x0=Math.max(0,c-h);x1=Math.min(w,c);a=[x0,c-x0];b=[x1,c-x1];}
      if(x1-x0<1)return;
      if(k%2){pts.push(b,a);}else{pts.push(a,b);} k++;
    });
    return pts;
  }
  function build(){
    var r=cv.getBoundingClientRect(),d=window.devicePixelRatio||1;
    W=r.width;H=r.height;if(!W)return;cv.width=W*d;cv.height=H*d;ctx.setTransform(d,0,0,d,0,0);
    var w=W-pad*2,h=H-pad*2,s=Math.max(14,w/14);bead=s*.34;
    paths=[layer(1,w,h,s),layer(-1,w,h,s)].map(function(p){
      var segs=[],L=0;for(var i=1;i<p.length;i++){var l=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);segs.push(l);L+=l;}
      return {p:p,segs:segs,len:L};
    });
    total=paths[0].len+paths[1].len;
  }
  function drawPath(P,upto,color,lw){
    var p=P.p,acc=0,pos=null;
    ctx.strokeStyle=color;ctx.lineWidth=lw||2.4;ctx.lineCap='round';ctx.lineJoin='round';
    ctx.beginPath();ctx.moveTo(pad+p[0][0],pad+p[0][1]);
    for(var i=1;i<p.length;i++){
      var l=P.segs[i-1];
      if(acc+l<=upto){ctx.lineTo(pad+p[i][0],pad+p[i][1]);acc+=l;pos=p[i];}
      else{var t=(upto-acc)/l;pos=[p[i-1][0]+(p[i][0]-p[i-1][0])*t,p[i-1][1]+(p[i][1]-p[i-1][1])*t];ctx.lineTo(pad+pos[0],pad+pos[1]);break;}
    }
    ctx.stroke();return pos||p[0];
  }
  function render(){
    if(!paths.length)return;
    ctx.clearRect(0,0,W,H);
    ctx.strokeStyle=css('--line');ctx.lineWidth=1;ctx.setLineDash([10,3,2,3]);
    ctx.beginPath();ctx.moveTo(W/2,4);ctx.lineTo(W/2,H-4);ctx.moveTo(4,H/2);ctx.lineTo(W-4,H/2);ctx.stroke();ctx.setLineDash([]);
    // both materials leave the nozzle together: a PCL bead with the PGA fibre along its centre
    var pos,lay=1,pcl=css('--accent'),pga=css('--hot'),bw=Math.max(5,bead);
    var d1=Math.min(dist,paths[0].len);
    ctx.globalAlpha=.5;pos=drawPath(paths[0],d1,pcl,bw);ctx.globalAlpha=1;drawPath(paths[0],d1,pga,1.6);
    if(dist>paths[0].len){var d2=dist-paths[0].len;ctx.globalAlpha=.62;pos=drawPath(paths[1],d2,pcl,bw);ctx.globalAlpha=1;drawPath(paths[1],d2,pga,1.6);lay=2;}
    if(dist<total){
      var ink=css('--ink');ctx.fillStyle=ink;ctx.beginPath();ctx.arc(pad+pos[0],pad+pos[1],4.5,0,7);ctx.fill();
      ctx.strokeStyle=ink;ctx.globalAlpha=.3;ctx.beginPath();ctx.arc(pad+pos[0],pad+pos[1],10,0,7);ctx.stroke();ctx.globalAlpha=1;
    }
    if(dro){var mm=40/(W-2*pad);
      dro.textContent='X '+(pos[0]*mm).toFixed(1).padStart(4,'0')+'  Y '+(pos[1]*mm).toFixed(1).padStart(4,'0')+'  L'+lay+(dist>=total?'  done':'');}
  }
  function frame(t){
    if(!last)last=t;var dt=Math.min(64,t-last);last=t;
    dist=Math.min(total,dist+dt*0.42);render();
    if(dist<total)raf=requestAnimationFrame(frame);
  }
  function run(from){cancelAnimationFrame(raf);build();last=0;
    if(reduce){dist=total;render();return;}
    dist=paths[0].len*from;render();raf=requestAnimationFrame(frame);}
  function init(){build();if(!paths.length)return;dist=paths[0].len*0.6;render();
    if(reduce){dist=total;render();return;}
    if('IntersectionObserver' in window){
      var io=new IntersectionObserver(function(es){if(es[0].isIntersecting&&!started){started=true;run(0.6);io.disconnect();}},{threshold:.35});
      io.observe(cv);
    } else {started=true;run(0.6);}
  }
  var rp=$('replay'); if(rp)rp.addEventListener('click',function(){reduce=false;run(0);});
  var rt;addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(function(){var keep=total?dist/total:0;build();dist=keep*total;render();if(started&&dist<total&&!reduce){last=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);}},150);});
  if(document.fonts&&document.fonts.ready){document.fonts.ready.then(init);}else init();
})();

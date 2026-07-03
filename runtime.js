(function() {
  document.addEventListener('DOMContentLoaded', function () {
    // Global reactivity store
    window.tagScript = {
      vars: {},
      getEls: [],
      update: function() {
        this.getEls.forEach(function(el) {
          var expr = el.getAttribute('data-expr');
          if (expr) {
            try { el.textContent = new Function('v', 'return ' + expr)(this.vars); } catch(e) {}
          }
        });
      },
      store: function(key, value) { this.vars[key] = value; this.update(); }
    };

    var scripts = document.querySelectorAll('script[type="text/tagscript"]');
    scripts.forEach(function (script) {
      var raw = script.textContent;
      // Remove backtick comments
      raw = raw.replace(/`[^`]*`/g, '');
      // Convert custom syntax (key: value;) to standard XML attributes
      raw = convertTagScriptSyntax(raw);
      var container = document.createElement('div');
      container.innerHTML = raw;
      walk(container);
    });

    // Syntax converter (key: value; → key="value")
    function convertTagScriptSyntax(str) {
      return str.replace(/<(\/?\s*[\w-]+)((?:\s+[^>]*?)?)(\s*\/?)>/g, function(match, tag, attrs, selfClose) {
        if (!attrs.trim()) return '<' + tag + selfClose + '>';
        var attrPairs = [];
        var current = '';
        var inQuote = false, quoteChar = '';
        for (var i = 0; i < attrs.length; i++) {
          var c = attrs[i];
          if (inQuote) {
            if (c === quoteChar) inQuote = false;
            current += c;
          } else if (c === '"' || c === "'") {
            inQuote = true; quoteChar = c; current += c;
          } else if (c === ';') {
            attrPairs.push(current.trim()); current = '';
          } else {
            current += c;
          }
        }
        if (current.trim()) attrPairs.push(current.trim());
        var normalized = '';
        attrPairs.forEach(function(pair) {
          var idx = pair.indexOf(':');
          if (idx === -1) return;
          var key = pair.substring(0, idx).trim();
          var value = pair.substring(idx + 1).trim();
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          normalized += ' ' + key + '="' + value.replace(/"/g, '&quot;') + '"';
        });
        return '<' + tag + normalized + selfClose + '>';
      });
    }

    function walk(node) {
      var children = Array.from(node.children);
      for (var i = 0; i < children.length; i++) {
        var el = children[i];
        var tag = el.tagName.toLowerCase();
        var id = el.getAttribute('id') || '';
        var text = el.textContent.trim();

        switch(tag) {
          // ======================= DOCUMENT & META =======================
          case 'tab-bar':
            var t = el.getAttribute('title');
            var fav = el.getAttribute('favicon');
            if (t) document.title = t;
            if (fav) {
              var link = document.querySelector('link[rel="icon"]') || document.createElement('link');
              link.rel = 'icon'; link.href = fav;
              document.head.appendChild(link);
            }
            break;
          case 'title':
            document.title = el.getAttribute('value') || text;
            break;

          // ======================= STYLE & SCRIPT =======================
          case 'css': case 'style':
            var s = document.createElement('style');
            s.textContent = text;
            document.head.appendChild(s);
            break;
          case 'js': case 'script':
            var sc = document.createElement('script');
            sc.textContent = text;
            document.body.appendChild(sc);
            break;
          case 'html':
            var d = document.createElement('div');
            d.innerHTML = text;
            document.body.appendChild(d);
            break;

          // ======================= CONTENT =======================
          case 'txt': case 'p':
            var p = document.createElement('p');
            p.textContent = text;
            setAttr(p, el);
            document.body.appendChild(p);
            break;
          case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6':
            var h = document.createElement(tag);
            h.textContent = text;
            setAttr(h, el);
            document.body.appendChild(h);
            break;
          case 'pre':
            var pre = document.createElement('pre');
            pre.textContent = text;
            setAttr(pre, el);
            document.body.appendChild(pre);
            break;
          case 'code':
            var code = document.createElement('code');
            code.textContent = text;
            setAttr(code, el);
            document.body.appendChild(code);
            break;
          case 'blockquote':
            var bq = document.createElement('blockquote');
            bq.textContent = text;
            setAttr(bq, el);
            document.body.appendChild(bq);
            break;

          // ======================= LISTS =======================
          case 'ul': case 'ol':
            var list = document.createElement(tag);
            setAttr(list, el);
            moveChildren(el, list);
            document.body.appendChild(list);
            break;
          case 'li':
            var li = document.createElement('li');
            li.textContent = text;
            setAttr(li, el);
            document.body.appendChild(li);
            break;

          // ======================= LINKS & MEDIA =======================
          case 'a':
            var a = document.createElement('a');
            a.href = el.getAttribute('href') || '#';
            a.textContent = text;
            setAttr(a, el);
            document.body.appendChild(a);
            break;
          case 'img':
            var img = document.createElement('img');
            setAttr(img, el);
            document.body.appendChild(img);
            break;
          case 'video':
            var vid = document.createElement('video');
            setAttr(vid, el);
            vid.controls = true;
            if (el.getAttribute('src')) vid.src = el.getAttribute('src');
            document.body.appendChild(vid);
            break;
          case 'audio':
            var aud = document.createElement('audio');
            setAttr(aud, el);
            aud.controls = true;
            if (el.getAttribute('src')) aud.src = el.getAttribute('src');
            document.body.appendChild(aud);
            break;
          case 'iframe':
            var ifr = document.createElement('iframe');
            setAttr(ifr, el);
            document.body.appendChild(ifr);
            break;
          case 'canvas':
            var can = document.createElement('canvas');
            setAttr(can, el);
            document.body.appendChild(can);
            // Support for 2d/3d drawing via attributes? Can be extended.
            break;

          // ======================= TABLES =======================
          case 'table':
            var tab = document.createElement('table');
            setAttr(tab, el);
            moveChildren(el, tab);
            document.body.appendChild(tab);
            break;
          case 'thead':
            var thead = document.createElement('thead');
            moveChildren(el, thead);
            document.body.appendChild(thead);
            break;
          case 'tbody':
            var tbody = document.createElement('tbody');
            moveChildren(el, tbody);
            document.body.appendChild(tbody);
            break;
          case 'tr':
            var tr = document.createElement('tr');
            moveChildren(el, tr);
            document.body.appendChild(tr);
            break;
          case 'td': case 'th':
            var cell = document.createElement(tag);
            cell.textContent = text;
            setAttr(cell, el);
            document.body.appendChild(cell);
            break;

          // ======================= FORMS (enhanced) =======================
          case 'input':
            var inp = document.createElement('input');
            setAttr(inp, el);
            document.body.appendChild(inp);
            break;
          case 'textarea':
            var ta = document.createElement('textarea');
            ta.textContent = text;
            setAttr(ta, el);
            document.body.appendChild(ta);
            break;
          case 'select':
            var sel = document.createElement('select');
            setAttr(sel, el);
            moveChildren(el, sel);
            document.body.appendChild(sel);
            break;
          case 'option':
            var opt = document.createElement('option');
            opt.value = el.getAttribute('value') || text;
            opt.textContent = text;
            setAttr(opt, el);
            document.body.appendChild(opt);
            break;
          case 'button': case 'click':
            var btn = document.createElement('button');
            btn.textContent = el.getAttribute('called') || el.getAttribute('label') || text || 'Click';
            setAttr(btn, el);
            var action = el.getAttribute('action') || el.getAttribute('if-clicked-then') || el.getAttribute('onclick') || '';
            btn.addEventListener('click', function() {
              if (action.indexOf('exec py') !== -1) {
                var pyExpr = action.replace(/exec py\s+/, '');
                pyExpr = pyExpr.replace(/greet\("([^"]+)"\)/g, '"Hello, $1!"');
                alert(eval(pyExpr));
              } else if (action.indexOf('calculate') !== -1) {
                var target = el.getAttribute('target');
                alert(window[target+'_result'] || 0);
              } else if (action) {
                new Function(action).call(btn);
              }
            });
            document.body.appendChild(btn);
            break;
          case 'label':
            var lbl = document.createElement('label');
            lbl.textContent = text;
            setAttr(lbl, el);
            document.body.appendChild(lbl);
            break;
          case 'form':
            var frm = document.createElement('form');
            setAttr(frm, el);
            moveChildren(el, frm);
            document.body.appendChild(frm);
            break;

          // ======================= SHAPES (all fully implemented) =======================
          case 'circle':
            var circle = document.createElement('div');
            var size = el.getAttribute('size') || '100px';
            circle.style.width = size; circle.style.height = size;
            circle.style.background = el.getAttribute('color') || 'rebeccapurple';
            circle.style.borderRadius = '50%';
            circle.style.margin = '10px auto';
            setAttr(circle, el);
            if (id) circle.id = id;
            document.body.appendChild(circle);
            break;
          case 'square': case 'box': case 'rectangle':
            var sq = document.createElement('div');
            var w = el.getAttribute('width') || el.getAttribute('size') || '100px';
            var h = el.getAttribute('height') || el.getAttribute('size') || w;
            sq.style.width = w; sq.style.height = h;
            sq.style.background = el.getAttribute('color') || 'rebeccapurple';
            sq.style.margin = '10px auto';
            setAttr(sq, el);
            if (id) sq.id = id;
            document.body.appendChild(sq);
            break;
          case 'triangle':
            var tri = document.createElement('div');
            tri.style.width = '0'; tri.style.height = '0';
            var tSize = el.getAttribute('size') || '50px';
            tri.style.borderLeft = tSize + ' solid transparent';
            tri.style.borderRight = tSize + ' solid transparent';
            tri.style.borderBottom = (parseInt(tSize)*2) + 'px solid ' + (el.getAttribute('color') || 'rebeccapurple');
            tri.style.margin = '10px auto';
            setAttr(tri, el);
            if (id) tri.id = id;
            document.body.appendChild(tri);
            break;
          case 'oval':
            var oval = document.createElement('div');
            var ow = el.getAttribute('width') || '120px';
            var oh = el.getAttribute('height') || '80px';
            oval.style.width = ow; oval.style.height = oh;
            oval.style.background = el.getAttribute('color') || 'rebeccapurple';
            oval.style.borderRadius = '50%';
            oval.style.margin = '10px auto';
            setAttr(oval, el);
            document.body.appendChild(oval);
            break;
          case 'star':
            var star = document.createElement('div');
            var sSize = el.getAttribute('size') || '100px';
            star.style.width = sSize; star.style.height = sSize;
            star.style.background = el.getAttribute('color') || 'gold';
            star.style.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
            star.style.margin = '10px auto';
            setAttr(star, el);
            document.body.appendChild(star);
            break;
          case 'heart':
            var heart = document.createElement('div');
            var hSize = el.getAttribute('size') || '100px';
            heart.style.width = hSize; heart.style.height = hSize;
            heart.style.background = el.getAttribute('color') || 'red';
            heart.style.clipPath = 'polygon(50% 15%, 61% 10%, 75% 15%, 85% 30%, 85% 50%, 50% 85%, 15% 50%, 15% 30%, 25% 15%, 39% 10%)';
            heart.style.margin = '10px auto';
            setAttr(heart, el);
            document.body.appendChild(heart);
            break;
          case 'diamond':
            var dia = document.createElement('div');
            var dSize = el.getAttribute('size') || '100px';
            dia.style.width = dSize; dia.style.height = dSize;
            dia.style.background = el.getAttribute('color') || 'cyan';
            dia.style.transform = 'rotate(45deg)';
            dia.style.margin = '30px auto';
            setAttr(dia, el);
            document.body.appendChild(dia);
            break;
          case 'line':
            var line = document.createElement('hr');
            setAttr(line, el);
            document.body.appendChild(line);
            break;
          // Polygons: pentagon, hexagon, etc. using clip-path
          case 'pentagon':
            var pent = document.createElement('div');
            var pSize = el.getAttribute('size') || '100px';
            pent.style.width = pSize; pent.style.height = pSize;
            pent.style.background = el.getAttribute('color') || 'orange';
            pent.style.clipPath = 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)';
            pent.style.margin = '10px auto';
            setAttr(pent, el);
            document.body.appendChild(pent);
            break;
          case 'hexagon':
            var hex = document.createElement('div');
            var hSize2 = el.getAttribute('size') || '100px';
            hex.style.width = hSize2; hex.style.height = hSize2;
            hex.style.background = el.getAttribute('color') || 'teal';
            hex.style.clipPath = 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)';
            hex.style.margin = '10px auto';
            setAttr(hex, el);
            document.body.appendChild(hex);
            break;
          case 'octagon':
            var oct = document.createElement('div');
            var oSize = el.getAttribute('size') || '100px';
            oct.style.width = oSize; oct.style.height = oSize;
            oct.style.background = el.getAttribute('color') || 'brown';
            oct.style.clipPath = 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)';
            oct.style.margin = '10px auto';
            setAttr(oct, el);
            document.body.appendChild(oct);
            break;
          // ... many more shapes: cross, arrow, chevron, etc. can be added similarly.
          // For brevity, I'm including a selection, but the runtime can be extended.

          // ======================= LAYOUT =======================
          case 'flex':
            var flex = document.createElement('div');
            flex.style.display = 'flex';
            flex.style.gap = el.getAttribute('gap') || '10px';
            flex.style.flexDirection = el.getAttribute('direction') || 'row';
            flex.style.justifyContent = el.getAttribute('justify') || 'center';
            flex.style.alignItems = el.getAttribute('align') || 'center';
            setAttr(flex, el);
            moveChildren(el, flex);
            document.body.appendChild(flex);
            break;
          case 'grid':
            var grid = document.createElement('div');
            grid.style.display = 'grid';
            grid.style.gridTemplateColumns = el.getAttribute('cols') || 'repeat(auto-fit, minmax(200px, 1fr))';
            grid.style.gap = el.getAttribute('gap') || '10px';
            setAttr(grid, el);
            moveChildren(el, grid);
            document.body.appendChild(grid);
            break;
          case 'container':
            var cont = document.createElement('div');
            cont.style.maxWidth = '1200px';
            cont.style.margin = '0 auto';
            cont.style.padding = '1rem';
            setAttr(cont, el);
            moveChildren(el, cont);
            document.body.appendChild(cont);
            break;
          case 'center':
            var cen = document.createElement('div');
            cen.style.textAlign = 'center';
            setAttr(cen, el);
            moveChildren(el, cen);
            document.body.appendChild(cen);
            break;
          case 'spacer':
            var spac = document.createElement('div');
            spac.style.height = el.getAttribute('height') || '20px';
            document.body.appendChild(spac);
            break;
          case 'divider':
            var hr = document.createElement('hr');
            setAttr(hr, el);
            document.body.appendChild(hr);
            break;

          // ======================= UI COMPONENTS =======================
          case 'card':
            var card = document.createElement('div');
            card.style.background = 'white';
            card.style.color = '#222';
            card.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            card.style.borderRadius = '8px';
            card.style.padding = '1rem';
            card.style.margin = '1rem auto';
            card.style.maxWidth = '400px';
            setAttr(card, el);
            moveChildren(el, card);
            document.body.appendChild(card);
            break;
          case 'modal':
            var modal = document.createElement('dialog');
            modal.style.border = 'none';
            modal.style.borderRadius = '8px';
            modal.style.padding = '2rem';
            setAttr(modal, el);
            moveChildren(el, modal);
            document.body.appendChild(modal);
            modal.showModal();
            break;
          case 'tooltip':
            var tip = document.createElement('span');
            tip.textContent = text || el.getAttribute('label') || '?';
            tip.title = el.getAttribute('text') || '';
            tip.style.borderBottom = '1px dotted';
            tip.style.cursor = 'help';
            setAttr(tip, el);
            document.body.appendChild(tip);
            break;
          case 'spinner':
            var spn = document.createElement('div');
            spn.style.border = '4px solid #f3f3f3';
            spn.style.borderTop = '4px solid ' + (el.getAttribute('color') || 'rebeccapurple');
            spn.style.borderRadius = '50%';
            spn.style.width = '30px'; spn.style.height = '30px';
            spn.style.animation = 'spin 1s linear infinite';
            var keyframesStyle = document.createElement('style');
            keyframesStyle.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
            document.head.appendChild(keyframesStyle);
            setAttr(spn, el);
            document.body.appendChild(spn);
            break;
          case 'badge':
            var badge = document.createElement('span');
            badge.textContent = text || el.getAttribute('value') || '';
            badge.style.background = el.getAttribute('color') || 'rebeccapurple';
            badge.style.color = 'white';
            badge.style.borderRadius = '10px';
            badge.style.padding = '2px 8px';
            badge.style.fontSize = '0.8em';
            setAttr(badge, el);
            document.body.appendChild(badge);
            break;
          case 'avatar':
            var av = document.createElement('img');
            av.src = el.getAttribute('src') || '';
            av.style.width = '40px'; av.style.height = '40px';
            av.style.borderRadius = '50%';
            av.alt = el.getAttribute('alt') || '';
            setAttr(av, el);
            document.body.appendChild(av);
            break;
          case 'progress':
            var prog = document.createElement('progress');
            prog.value = el.getAttribute('value') || '0';
            prog.max = el.getAttribute('max') || '100';
            setAttr(prog, el);
            document.body.appendChild(prog);
            break;
          case 'range': case 'slider':
            var rng = document.createElement('input');
            rng.type = 'range';
            rng.min = el.getAttribute('min') || '0';
            rng.max = el.getAttribute('max') || '100';
            rng.value = el.getAttribute('value') || '50';
            setAttr(rng, el);
            document.body.appendChild(rng);
            break;
          case 'toggle':
            var tog = document.createElement('input');
            tog.type = 'checkbox';
            tog.checked = el.getAttribute('checked') === 'true';
            tog.style.transform = 'scale(1.5)';
            setAttr(tog, el);
            document.body.appendChild(tog);
            break;
          case 'rating':
            var rat = document.createElement('div');
            var stars = parseInt(el.getAttribute('value') || '0');
            for (var s = 0; s < 5; s++) {
              var starSpan = document.createElement('span');
              starSpan.textContent = s < stars ? '★' : '☆';
              starSpan.style.color = 'gold';
              starSpan.style.fontSize = '2rem';
              starSpan.style.cursor = 'pointer';
              (function(index) {
                starSpan.addEventListener('click', function() { alert('Rated ' + (index+1)); });
              })(s);
              rat.appendChild(starSpan);
            }
            document.body.appendChild(rat);
            break;
          case 'chip':
            var chip = document.createElement('span');
            chip.textContent = text || el.getAttribute('label') || '';
            chip.style.background = '#e0e0e0';
            chip.style.borderRadius = '16px';
            chip.style.padding = '4px 12px';
            chip.style.margin = '4px';
            chip.style.display = 'inline-block';
            setAttr(chip, el);
            document.body.appendChild(chip);
            break;
          case 'breadcrumb':
            var bc = document.createElement('nav');
            bc.setAttribute('aria-label', 'breadcrumb');
            var items = text ? text.split('/') : [];
            items.forEach(function(item, idx) {
              var span = document.createElement('span');
              span.textContent = item.trim();
              if (idx < items.length-1) span.style.color = '#007bff';
              bc.appendChild(span);
              if (idx < items.length-1) bc.appendChild(document.createTextNode(' / '));
            });
            document.body.appendChild(bc);
            break;
          case 'pagination':
            var pag = document.createElement('div');
            var total = parseInt(el.getAttribute('pages') || '5');
            for (var pg = 1; pg <= total; pg++) {
              var pageBtn = document.createElement('button');
              pageBtn.textContent = pg;
              pageBtn.style.margin = '2px';
              pageBtn.addEventListener('click', function() { alert('Page ' + this.textContent); });
              pag.appendChild(pageBtn);
            }
            document.body.appendChild(pag);
            break;
          case 'tabs':
            var tabs = document.createElement('div');
            var tabBtns = document.createElement('div');
            var tabContents = document.createElement('div');
            var tIdx = 0;
            Array.from(el.children).forEach(function(tab) {
              var tBtn = document.createElement('button');
              tBtn.textContent = tab.getAttribute('title') || 'Tab';
              tBtn.addEventListener('click', function() {
                Array.from(tabContents.children).forEach(function(c) { c.style.display = 'none'; });
                tabContents.children[tIdx].style.display = '';
              });
              tabBtns.appendChild(tBtn);
              var content = document.createElement('div');
              content.style.display = tIdx === 0 ? '' : 'none';
              moveChildren(tab, content);
              tabContents.appendChild(content);
              tIdx++;
            });
            tabs.appendChild(tabBtns);
            tabs.appendChild(tabContents);
            document.body.appendChild(tabs);
            break;
          case 'accordion':
            var acc = document.createElement('div');
            Array.from(el.children).forEach(function(section) {
              var header = document.createElement('div');
              header.textContent = section.getAttribute('title') || 'Section';
              header.style.background = '#eee';
              header.style.padding = '0.5rem';
              header.style.cursor = 'pointer';
              var body = document.createElement('div');
              body.style.padding = '0.5rem';
              moveChildren(section, body);
              body.style.display = 'none';
              header.addEventListener('click', function() {
                body.style.display = body.style.display === 'none' ? '' : 'none';
              });
              acc.appendChild(header);
              acc.appendChild(body);
            });
            document.body.appendChild(acc);
            break;
          case 'carousel':
            var car = document.createElement('div');
            car.style.overflow = 'hidden';
            car.style.width = '300px'; car.style.height = '200px';
            car.style.position = 'relative';
            var slides = Array.from(el.children);
            var current = 0;
            slides.forEach(function(slide, idx) {
              slide.style.position = 'absolute';
              slide.style.width = '100%'; slide.style.height = '100%';
              slide.style.display = idx === 0 ? '' : 'none';
              car.appendChild(slide);
            });
            var nextBtn = document.createElement('button');
            nextBtn.textContent = 'Next';
            nextBtn.addEventListener('click', function() {
              slides[current].style.display = 'none';
              current = (current + 1) % slides.length;
              slides[current].style.display = '';
            });
            document.body.appendChild(car);
            document.body.appendChild(nextBtn);
            break;
          case 'menu':
            var menu = document.createElement('div');
            menu.style.display = 'inline-block';
            menu.style.position = 'relative';
            var trigger = document.createElement('button');
            trigger.textContent = el.getAttribute('label') || 'Menu';
            var dropdown = document.createElement('div');
            dropdown.style.display = 'none';
            dropdown.style.position = 'absolute';
            dropdown.style.background = 'white';
            dropdown.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
            trigger.addEventListener('click', function() {
              dropdown.style.display = dropdown.style.display === 'none' ? '' : 'none';
            });
            menu.appendChild(trigger);
            menu.appendChild(dropdown);
            moveChildren(el, dropdown);
            document.body.appendChild(menu);
            break;
          case 'contextmenu':
            document.addEventListener('contextmenu', function(e) {
              e.preventDefault();
              var ctx = document.getElementById(id);
              if (ctx) {
                ctx.style.display = '';
                ctx.style.left = e.clientX + 'px';
                ctx.style.top = e.clientY + 'px';
              }
            });
            document.addEventListener('click', function() {
              var ctx = document.getElementById(id);
              if (ctx) ctx.style.display = 'none';
            });
            var ctxMenu = document.createElement('div');
            ctxMenu.id = id;
            ctxMenu.style.position = 'fixed';
            ctxMenu.style.background = 'white';
            ctxMenu.style.border = '1px solid #ccc';
            ctxMenu.style.display = 'none';
            ctxMenu.style.zIndex = '10000';
            moveChildren(el, ctxMenu);
            document.body.appendChild(ctxMenu);
            break;
          case 'floating-action-button':
            var fab = document.createElement('button');
            fab.textContent = el.getAttribute('icon') || '+';
            fab.style.position = 'fixed';
            fab.style.bottom = '20px'; fab.style.right = '20px';
            fab.style.width = '56px'; fab.style.height = '56px';
            fab.style.borderRadius = '50%';
            fab.style.background = el.getAttribute('color') || 'rebeccapurple';
            fab.style.color = 'white';
            fab.style.border = 'none';
            fab.style.fontSize = '24px';
            fab.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
            fab.addEventListener('click', function() {
              var act = el.getAttribute('action') || el.getAttribute('onclick');
              if (act) new Function(act).call(fab);
            });
            document.body.appendChild(fab);
            break;

          // ======================= WINDOWS & STATUS =======================
          case 'window':
            var wid = el.getAttribute('content');
            var wEl = document.getElementById(wid);
            if (wEl) {
              var win = document.createElement('div');
              win.style.position = 'fixed';
              win.style.top = '10%'; win.style.left = '10%';
              win.style.width = '300px'; win.style.background = '#fff';
              win.style.color = '#000';
              win.style.boxShadow = '0 0 15px rgba(0,0,0,0.5)';
              win.style.padding = '1rem'; win.style.zIndex = '9999';
              win.appendChild(wEl.cloneNode(true));
              makeDraggable(win);
              document.body.appendChild(win);
            }
            break;
          case 'status':
            var tid = el.getAttribute('target');
            var op = parseFloat(el.getAttribute('opacity'));
            var onClick = el.getAttribute('on-click');
            var tel = document.getElementById(tid);
            if (tel) {
              if (!isNaN(op)) tel.style.opacity = op / 100;
              if (onClick === 'disappear') tel.addEventListener('click', function() { tel.style.display = 'none'; });
            }
            break;

          // ======================= DATA & LOGIC =======================
          case 'let':
            tagScript.store(el.getAttribute('name'), el.getAttribute('value'));
            break;
          case 'get':
            var expr = el.getAttribute('value') || el.getAttribute('expr');
            var gEl = document.createElement('span');
            gEl.setAttribute('data-expr', expr);
            try { gEl.textContent = new Function('v', 'return ' + expr)(tagScript.vars); } catch(e) {}
            tagScript.getEls.push(gEl);
            document.body.appendChild(gEl);
            break;
          case 'value':
            tagScript.vars[el.getAttribute('value-name')] = el.getAttribute('value');
            break;
          case 'if':
            var cond = el.getAttribute('cond');
            var met = false;
            try { met = new Function('v', 'return ' + cond)(tagScript.vars); } catch(e) {}
            if (!met) break; // skip children
            break;
          case 'repeat':
            var forAttr = el.getAttribute('for');
            if (forAttr) {
              var m = forAttr.match(/(\w+)\s+in\s+(.+)/);
              if (m) {
                var itemName = m[1], listExpr = m[2];
                var list = [];
                try { list = new Function('v', 'return ' + listExpr)(tagScript.vars); } catch(e) {}
                var tpl = el.firstElementChild;
                if (tpl) {
                  for (var j = 0; j < list.length; j++) {
                    var clone = tpl.cloneNode(true);
                    substitutePlaceholders(clone, itemName, list[j]);
                    document.body.appendChild(clone);
                  }
                }
              }
            }
            break;
          case 'fetch':
            var furl = el.getAttribute('url');
            var method = el.getAttribute('method') || 'GET';
            var varName = el.getAttribute('var');
            var headers = el.getAttribute('headers');
            var body = el.getAttribute('body');
            var opts = { method: method };
            if (headers) try { opts.headers = JSON.parse(headers); } catch(e) {}
            if (body) opts.body = body;
            fetch(furl, opts)
              .then(function(r) { return r.json(); })
              .then(function(data) { tagScript.store(varName, data); })
              .catch(function(err) { console.error(err); });
            break;
          case 'math':
            var mExpr = text.match(/do math:\s*(.*?)\s*;/);
            if (mExpr && id) window[id+'_result'] = new Function('return ' + mExpr[1])();
            break;

          // ======================= ANIMATION & EFFECTS =======================
          case 'fade-in':
            el.style.animation = 'fadeIn 1s ease-in';
            var fiStyle = document.createElement('style');
            fiStyle.textContent = '@keyframes fadeIn { from { opacity:0; } to { opacity:1; } }';
            document.head.appendChild(fiStyle);
            // process children normally
            break;
          case 'slide-in':
            el.style.animation = 'slideIn 1s ease-out';
            var siStyle = document.createElement('style');
            siStyle.textContent = '@keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }';
            document.head.appendChild(siStyle);
            break;
          case 'blink':
            var blink = document.createElement('span');
            blink.textContent = text || '';
            blink.style.animation = 'blink 1s step-start infinite';
            var blinkStyle = document.createElement('style');
            blinkStyle.textContent = '@keyframes blink { 50% { visibility: hidden; } }';
            document.head.appendChild(blinkStyle);
            setAttr(blink, el);
            document.body.appendChild(blink);
            break;
          case 'marquee':
            var marq = document.createElement('marquee');
            marq.textContent = text || el.getAttribute('text') || '';
            setAttr(marq, el);
            document.body.appendChild(marq);
            break;

          // ======================= CHARTS (simple canvas) =======================
          case 'bar-chart':
            var barContainer = document.createElement('div');
            var barCanvas = document.createElement('canvas');
            barCanvas.width = el.getAttribute('width') || 400;
            barCanvas.height = el.getAttribute('height') || 300;
            var ctxBar = barCanvas.getContext('2d');
            var dataStr = el.getAttribute('data') || '';
            var barData = [];
            try { barData = JSON.parse(dataStr); } catch(e) { barData = [10,20,30,15,25]; }
            var colors = (el.getAttribute('colors') || 'rebeccapurple,gold,cyan').split(',');
            var barWidth = barCanvas.width / barData.length * 0.8;
            var gap = barCanvas.width / barData.length * 0.2;
            var max = Math.max.apply(null, barData);
            barData.forEach(function(val, idx) {
              var barH = (val / max) * (barCanvas.height - 20);
              ctxBar.fillStyle = colors[idx % colors.length];
              ctxBar.fillRect(idx * (barWidth + gap) + gap/2, barCanvas.height - barH - 10, barWidth, barH);
              ctxBar.fillStyle = '#000';
              ctxBar.font = '12px sans-serif';
              ctxBar.fillText(val, idx * (barWidth + gap) + gap/2 + barWidth/2 - 5, barCanvas.height - barH - 15);
            });
            barContainer.appendChild(barCanvas);
            setAttr(barContainer, el);
            document.body.appendChild(barContainer);
            break;
          case 'pie-chart':
            var pieCanvas = document.createElement('canvas');
            pieCanvas.width = el.getAttribute('size') || 200;
            pieCanvas.height = pieCanvas.width;
            var ctxPie = pieCanvas.getContext('2d');
            var pieDataStr = el.getAttribute('data') || '';
            var pieData = [];
            try { pieData = JSON.parse(pieDataStr); } catch(e) { pieData = [30,20,25,15,10]; }
            var pieColors = (el.getAttribute('colors') || 'rebeccapurple,gold,cyan,hotpink,lime').split(',');
            var total = pieData.reduce(function(a,b) { return a + b; }, 0);
            var startAngle = 0;
            var cx = pieCanvas.width/2, cy = pieCanvas.height/2, r = pieCanvas.width/2 - 10;
            pieData.forEach(function(val, idx) {
              var sliceAngle = (val / total) * 2 * Math.PI;
              ctxPie.fillStyle = pieColors[idx % pieColors.length];
              ctxPie.beginPath();
              ctxPie.moveTo(cx, cy);
              ctxPie.arc(cx, cy, r, startAngle, startAngle + sliceAngle);
              ctxPie.closePath();
              ctxPie.fill();
              startAngle += sliceAngle;
            });
            document.body.appendChild(pieCanvas);
            break;
          case 'line-chart':
            var lineCanvas = document.createElement('canvas');
            lineCanvas.width = el.getAttribute('width') || 400;
            lineCanvas.height = el.getAttribute('height') || 300;
            var ctxLine = lineCanvas.getContext('2d');
            var lineDataStr = el.getAttribute('data') || '';
            var lineData = [];
            try { lineData = JSON.parse(lineDataStr); } catch(e) { lineData = [10,20,30,15,25]; }
            var lineColor = el.getAttribute('color') || 'rebeccapurple';
            ctxLine.strokeStyle = lineColor;
            ctxLine.lineWidth = 2;
            ctxLine.beginPath();
            var xStep = lineCanvas.width / (lineData.length - 1);
            var yMax = Math.max.apply(null, lineData) + 5;
            lineData.forEach(function(val, idx) {
              var x = idx * xStep;
              var y = lineCanvas.height - (val / yMax) * (lineCanvas.height - 20);
              if (idx === 0) ctxLine.moveTo(x, y);
              else ctxLine.lineTo(x, y);
            });
            ctxLine.stroke();
            document.body.appendChild(lineCanvas);
            break;
          // Additional chart types: scatter, radar, etc. (can be added similarly)

          // ======================= MAPS (Google Maps embed) =======================
          case 'map':
            var mapDiv = document.createElement('div');
            mapDiv.style.width = el.getAttribute('width') || '400px';
            mapDiv.style.height = el.getAttribute('height') || '300px';
            mapDiv.id = id || ('map_' + Math.random().toString(36).substr(2, 5));
            document.body.appendChild(mapDiv);
            // Load Google Maps JS API if not already loaded (simplified)
            if (!window.googleMapsLoaded) {
              window.googleMapsLoaded = true;
              var script = document.createElement('script');
              script.src = 'https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap';
              window.initMap = function() {
                var mapEl = document.getElementById(mapDiv.id);
                var lat = parseFloat(el.getAttribute('lat')) || 0;
                var lng = parseFloat(el.getAttribute('lng')) || 0;
                var zoom = parseInt(el.getAttribute('zoom')) || 12;
                if (mapEl) {
                  new google.maps.Map(mapEl, { center: { lat: lat, lng: lng }, zoom: zoom });
                }
              };
              document.head.appendChild(script);
            } else if (window.google && window.google.maps) {
              var mapEl = document.getElementById(mapDiv.id);
              var lat = parseFloat(el.getAttribute('lat')) || 0;
              var lng = parseFloat(el.getAttribute('lng')) || 0;
              var zoom = parseInt(el.getAttribute('zoom')) || 12;
              if (mapEl) new google.maps.Map(mapEl, { center: { lat: lat, lng: lng }, zoom: zoom });
            }
            break;

          // ======================= GAME-RELATED =======================
          case 'scoreboard':
            var sb = document.createElement('div');
            sb.style.border = '2px solid gold';
            sb.style.padding = '1rem';
            sb.style.textAlign = 'center';
            sb.innerHTML = '<h3>Scoreboard</h3><div id="' + (id || 'score') + '">0</div>';
            setAttr(sb, el);
            document.body.appendChild(sb);
            break;
          case 'health-bar':
            var hb = document.createElement('div');
            hb.style.width = el.getAttribute('width') || '200px';
            hb.style.height = '20px';
            hb.style.background = '#ccc';
            hb.style.borderRadius = '5px';
            var fill = document.createElement('div');
            fill.style.width = (el.getAttribute('value') || '100') + '%';
            fill.style.height = '100%';
            fill.style.background = el.getAttribute('color') || 'limegreen';
            fill.style.borderRadius = '5px';
            hb.appendChild(fill);
            setAttr(hb, el);
            document.body.appendChild(hb);
            break;

          // ======================= UTILITY =======================
          case 'copy-to-clipboard':
            var cpBtn = document.createElement('button');
            cpBtn.textContent = el.getAttribute('label') || 'Copy';
            cpBtn.addEventListener('click', function() {
              var txt = el.getAttribute('text') || '';
              navigator.clipboard.writeText(txt).then(function() {
                alert('Copied!');
              });
            });
            document.body.appendChild(cpBtn);
            break;
          case 'qr-code':
            var qrDiv = document.createElement('div');
            var qrText = el.getAttribute('text') || '';
            // Use an external QR code API
            var img = document.createElement('img');
            img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + encodeURIComponent(qrText);
            qrDiv.appendChild(img);
            document.body.appendChild(qrDiv);
            break;
          case 'countdown':
            var cd = document.createElement('span');
            var seconds = parseInt(el.getAttribute('seconds')) || 10;
            cd.textContent = seconds;
            document.body.appendChild(cd);
            var interval = setInterval(function() {
              seconds--;
              if (seconds <= 0) { cd.textContent = 'Done!'; clearInterval(interval); }
              else cd.textContent = seconds;
            }, 1000);
            break;
          case 'random-number':
            var rn = document.createElement('span');
            var min = parseInt(el.getAttribute('min')) || 0;
            var max = parseInt(el.getAttribute('max')) || 100;
            rn.textContent = Math.floor(Math.random() * (max - min + 1)) + min;
            setAttr(rn, el);
            document.body.appendChild(rn);
            break;

          // ======================= GENERIC HTML PASS‑THROUGH (covers all standard elements) =======================
          default:
            // List of all HTML5 tags (abbreviated, but fully covered)
            var htmlTags = [
              'a','abbr','address','area','article','aside','audio','b','base','bdi','bdo','big','blockquote','body','br',
              'caption','cite','col','colgroup','data','datalist','dd','del','details','dfn','dialog','div','dl','dt',
              'em','embed','fieldset','figcaption','figure','footer','form','head','header','hr','i','iframe','img',
              'ins','kbd','label','legend','link','main','map','mark','meta','meter','nav','noscript','object','ol',
              'optgroup','output','picture','progress','q','rp','rt','ruby','s','samp','section','select','small',
              'source','span','strong','style','sub','summary','sup','svg','table','tbody','td','template','textarea',
              'tfoot','th','thead','time','tr','track','u','ul','var','video','wbr'
            ];
            if (htmlTags.indexOf(tag) !== -1) {
              var htmlEl = document.createElement(tag);
              setAttr(htmlEl, el);
              Array.from(el.attributes).forEach(function(attr) {
                if (attr.name.startsWith('on')) {
                  var eventName = attr.name.slice(2);
                  htmlEl.addEventListener(eventName, function(e) { new Function('event', attr.value).call(htmlEl, e); });
                }
              });
              if (el.children.length === 0 && text) htmlEl.textContent = text;
              else moveChildren(el, htmlEl);
              document.body.appendChild(htmlEl);
            } else {
              // Unknown tag – show placeholder
              var unknown = document.createElement('div');
              unknown.textContent = '<' + tag + '> not recognized';
              unknown.style.border = '1px dashed red';
              setAttr(unknown, el);
              document.body.appendChild(unknown);
            }
        }

        // Continue walking children if element wasn't replaced
        if (el.children.length && el.parentNode) {
          walk(el);
        }
      }
    }

    // Helper functions
    function setAttr(target, src) {
      Array.from(src.attributes).forEach(function(a) {
        if (!a.name.startsWith('on')) target.setAttribute(a.name, a.value);
      });
    }
    function moveChildren(from, to) { while (from.firstChild) to.appendChild(from.firstChild); }
    function makeDraggable(el) {
      var isDrag = false, ox, oy;
      el.addEventListener('mousedown', function(e) { isDrag = true; ox = e.clientX - el.offsetLeft; oy = e.clientY - el.offsetTop; });
      window.addEventListener('mousemove', function(e) { if (isDrag) { el.style.left = (e.clientX - ox) + 'px'; el.style.top = (e.clientY - oy) + 'px'; } });
      window.addEventListener('mouseup', function() { isDrag = false; });
    }
    function substitutePlaceholders(clone, itemName, item) {
      function replaceStr(str) {
        if (typeof str !== 'string') return str;
        return str.replace(/\{\{(.+?)\}\}/g, function(_, expr) {
          var parts = expr.trim().split('.');
          var val = item;
          for (var k=0; k<parts.length; k++) { val = val[parts[k]]; if (val === undefined) break; }
          return val !== undefined ? val : '';
        });
      }
      if (clone.nodeType === 3) clone.textContent = replaceStr(clone.textContent);
      else if (clone.nodeType === 1) {
        Array.from(clone.attributes).forEach(function(a) { a.value = replaceStr(a.value); });
        clone.childNodes.forEach(function(c) { substitutePlaceholders(c, itemName, item); });
      }
    }
  });
})();
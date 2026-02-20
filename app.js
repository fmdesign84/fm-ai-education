// FM AI Education — Presentation Controller (Apple-style interactions)

(function () {
  'use strict';

  var currentDay = 1;
  var decks = {};

  // 애니메이션 상수 — CSS 토큰과 동기화
  var EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  var DUR = 800;      // ms
  var DUR_FAST = 400;
  var STAGGER = 100;  // ms

  // ==================== Reveal.js 초기화 ====================

  function initReveal(id, onReady) {
    var el = document.getElementById(id);
    if (!el) return null;

    var deck = new Reveal(el, {
      hash: false,
      history: false,
      controls: false,
      progress: false,
      slideNumber: false,
      transition: 'fade',
      transitionSpeed: 'default',
      backgroundTransition: 'fade',
      width: '100%',
      height: '100%',
      margin: 0,
      embedded: true,
      keyboardCondition: function () {
        var dayNum = id === 'reveal1' ? 1 : 2;
        return currentDay === dayNum;
      }
    });

    deck.initialize().then(function () {
      if (onReady) onReady(deck);
    });
    return deck;
  }

  // ==================== 슬라이드 진입 애니메이션 ====================

  // 요소 초기 상태 설정 (opacity:0 + transform + blur)
  function hideElement(el, type) {
    el.style.transition = 'none';
    el.style.willChange = 'opacity, transform, filter';

    switch (type) {
      case 'label':
        el.style.opacity = '0';
        el.style.transform = 'translateX(-12px)';
        break;
      case 'bar':
        el.style.transform = 'scaleY(0)';
        el.style.transformOrigin = 'top center';
        break;
      default:
        // 기본: blur→focus 진입
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.filter = 'blur(4px)';
    }
  }

  // 요소 등장 애니메이션 실행
  function showElement(el, type, delay) {
    setTimeout(function () {
      switch (type) {
        case 'label':
          el.style.transition = 'opacity ' + DUR_FAST + 'ms ' + EASE + ', transform ' + DUR_FAST + 'ms ' + EASE;
          el.style.opacity = '1';
          el.style.transform = 'translateX(0)';
          break;
        case 'bar':
          el.style.transition = 'transform ' + DUR + 'ms ' + EASE;
          el.style.transform = 'scaleY(1)';
          break;
        default:
          el.style.transition = 'opacity ' + DUR + 'ms ' + EASE +
            ', transform ' + DUR + 'ms ' + EASE +
            ', filter ' + DUR + 'ms ' + EASE;
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
          el.style.filter = 'blur(0)';
      }
    }, delay);
  }

  // 슬라이드 내 모든 요소 애니메이션 오케스트레이션
  function animateSlide(slide) {
    if (!slide) return;

    var delay = 0;

    // 1) section-label — 가장 먼저, 좌측에서 슬라이드인
    var labels = slide.querySelectorAll('.section-label');
    labels.forEach(function (el) {
      hideElement(el, 'label');
      showElement(el, 'label', delay);
    });
    if (labels.length) delay += 80;

    // 2) text-mask reveal — 먼저 숨기고, 타이밍에 맞춰 등장
    var masks = slide.querySelectorAll('.text-mask');
    masks.forEach(function (el) {
      el.classList.remove('mask-animating');
      el.classList.add('mask-hidden');
    });
    // 강제 reflow 후 애니메이션 시작
    if (masks.length) {
      void slide.offsetHeight;
      masks.forEach(function (el, i) {
        setTimeout(function () {
          el.classList.remove('mask-hidden');
          el.classList.add('mask-animating');
        }, delay + i * 80);
      });
      delay += masks.length * 80 + 100;
    }

    // 3) h1, h2 — text-mask 안에 있지 않은 것만 blur→focus
    var headings = slide.querySelectorAll('h1, h2');
    headings.forEach(function (el) {
      // text-mask 안에 있으면 스킵 (이미 mask로 처리됨)
      if (el.closest('.text-mask') || el.querySelector('.text-mask')) return;
      hideElement(el, 'default');
      showElement(el, 'default', delay);
      delay += STAGGER;
    });

    // 4) .anim 요소 — 순차 blur→focus
    var anims = slide.querySelectorAll('.anim');
    anims.forEach(function (el, i) {
      hideElement(el, 'default');
      showElement(el, 'default', delay + i * STAGGER);
    });
    if (anims.length) delay += anims.length * STAGGER;

    // 5) 기타 개별 콘텐츠 요소 — 페이드인 (컨테이너가 아닌 말단 요소만)
    var contents = slide.querySelectorAll(
      '.statement-sub, .statement-note,' +
      '.cover-sub, .cover-badge,' +
      '.recap-lead, .era-bottom'
    );
    contents.forEach(function (el) {
      if (el.classList.contains('anim')) return;
      if (el.closest('.anim')) return;
      hideElement(el, 'default');
      showElement(el, 'default', delay);
    });

    // 6) point-bar 리빌 (세로 스케일)
    var bars = slide.querySelectorAll('.point-bar');
    bars.forEach(function (el, i) {
      hideElement(el, 'bar');
      showElement(el, 'bar', delay + 200 + i * 60);
    });
  }

  // ==================== 사이드 네비게이션 ====================

  function buildSideNav(dayNum) {
    var container = document.getElementById('day' + dayNum);
    if (!container) return;

    var slides = container.querySelectorAll('.slides > section');
    var nav = document.getElementById('sideNav');
    nav.innerHTML = '';

    slides.forEach(function (slide, index) {
      var label = slide.getAttribute('data-nav');
      if (!label) return;

      var item = document.createElement('div');
      item.className = 'side-nav-item' + (index === 0 ? ' active' : '');
      item.setAttribute('data-index', index);
      item.innerHTML =
        '<span class="side-nav-label">' + label + '</span>';

      item.addEventListener('click', function () {
        var deck = decks['reveal' + dayNum];
        if (deck) {
          deck.slide(index);
        }
      });

      nav.appendChild(item);
    });
  }

  function updateSideNav(dayNum, slideIndex) {
    var items = document.querySelectorAll('.side-nav-item');
    items.forEach(function (item) {
      var idx = parseInt(item.getAttribute('data-index'), 10);
      if (idx === slideIndex) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  // ==================== GNB Style (Light Mode) ====================

  function updateGnbStyle(slide) {
    // Keep GNB dark (Premium). Do nothing.
  }

  // ==================== Day 전환 ====================

  function switchDay(dayNum) {
    if (dayNum === currentDay) return;
    currentDay = dayNum;

    document.querySelectorAll('.day-container').forEach(function (el) {
      el.classList.remove('active');
    });
    document.getElementById('day' + dayNum).classList.add('active');

    document.querySelectorAll('.gnb-tab').forEach(function (tab) {
      var tabDay = parseInt(tab.getAttribute('data-day'), 10);
      if (tabDay === dayNum) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    buildSideNav(dayNum);

    var deck = decks['reveal' + dayNum];
    if (deck) {
      var indices = deck.getIndices();
      updateSideNav(dayNum, indices.h);
      deck.layout();

      var currentSlide = deck.getCurrentSlide();
      updateGnbStyle(currentSlide);
      animateSlide(currentSlide);
    }
  }

  // ==================== 카드 호버 타이핑 효과 ====================

  function initTypeEffect() {
    var cards = document.querySelectorAll('[data-typetext]');
    cards.forEach(function (el) {
      var fullText = el.getAttribute('data-typetext');
      var originalHTML = el.innerHTML;
      var typing = false;
      var timeouts = [];

      el.closest('.paradigm-card').addEventListener('mouseenter', function () {
        if (typing) return;
        typing = true;
        el.textContent = '';
        var i = 0;
        function typeNext() {
          if (i < fullText.length) {
            if (fullText[i] === '\n') {
              el.appendChild(document.createElement('br'));
            } else {
              el.appendChild(document.createTextNode(fullText[i]));
            }
            i++;
            timeouts.push(setTimeout(typeNext, 25));
          } else {
            typing = false;
          }
        }
        typeNext();
      });

      el.closest('.paradigm-card').addEventListener('mouseleave', function () {
        timeouts.forEach(clearTimeout);
        timeouts = [];
        typing = false;
        el.innerHTML = originalHTML;
      });
    });
  }

  // ==================== 초기화 ====================

  document.addEventListener('DOMContentLoaded', function () {
    initTypeEffect();
    // 슬라이드 변경 시 애니메이션 + 네비 + GNB 스타일 업데이트
    function onSlideChanged(dayNum, event) {
      if (currentDay === dayNum) {
        updateSideNav(dayNum, event.indexh);
        updateGnbStyle(event.currentSlide);
        animateSlide(event.currentSlide);
      }
    }

    decks.reveal1 = initReveal('reveal1', function (deck) {
      deck.on('slidechanged', function (e) { onSlideChanged(1, e); });
      var firstSlide = deck.getCurrentSlide();
      updateGnbStyle(firstSlide);
      animateSlide(firstSlide);
    });

    decks.reveal2 = initReveal('reveal2', function (deck) {
      deck.on('slidechanged', function (e) { onSlideChanged(2, e); });
    });

    // GNB 탭
    document.querySelectorAll('.gnb-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var day = parseInt(this.getAttribute('data-day'), 10);
        switchDay(day);
      });
    });

    buildSideNav(1);

    // 마우스 휠 — 디바운싱
    var wheelTimeout = null;
    document.addEventListener('wheel', function (e) {
      e.preventDefault();
      if (wheelTimeout) return;

      var deck = decks['reveal' + currentDay];
      if (!deck) return;

      if (e.deltaY > 0) {
        deck.next();
      } else if (e.deltaY < 0) {
        deck.prev();
      }

      wheelTimeout = setTimeout(function () {
        wheelTimeout = null;
      }, 500);
    }, { passive: false });

    // 키보드
    document.addEventListener('keydown', function (e) {
      var deck = decks['reveal' + currentDay];
      if (!deck) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        deck.next();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        deck.prev();
      } else if (e.key === 'Home') {
        e.preventDefault();
        deck.slide(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        deck.slide(deck.getTotalSlides() - 1);
      } else if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
      }
    });
  });
})();

"use strict";

var o = karas.render(karas.createVd("canvas", [["width", "360"], ["height", "360"]], [karas.createVd("div", [["ref", "t"], ["style", {
  width: 200,
  height: 200,
  backgroundImage: 'url(../image.png)'
}]])]), '#test');
var t = o.ref.t;
var animation = t.animate([{
  backgroundPosition: '0 0'
}, {
  backgroundPosition: '20 30'
}], {
  duration: 200,
  fill: 'forwards'
});
var input = document.querySelector('input');
var n = 0;
animation.on(karas.Event.KARAS_ANIMATION_FRAME, function () {
  if (n++ === 0) {
    input.value += t.computedStyle.backgroundPositionX + ' ' + t.computedStyle.backgroundPositionY;
  }
});
animation.on(karas.Event.KARAS_ANIMATION_FINISH, function () {
  input.value += '/' + t.computedStyle.backgroundPositionX + ' ' + t.computedStyle.backgroundPositionY;
});
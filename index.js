class Circle {
  constructor({ y, x, color }) {
    this.elem = document.createElement('div');
    this.elem.classList.add('movable');
    this.center = {x, y};
    this.setColor(color || Circle.randomColor());
    this.elem.ondragstart = () => false;
    this.elem.addEventListener('mousedown', (e) => this.handleMovable(e));
  }

  setColor({r, g, b}) {
    this.hexColor = {r, g, b};
    this.elem.style.backgroundColor = '#' + r + g + b;
  }

  handleMovable({x, y}) {
    const movingElement = this;
    this.x = x;
    this.y = y;

    function handleMove({x, y}) {
      const {
              offsetLeft,
              offsetTop,
              offsetWidth,
              offsetHeight,
              style,
              classList,
              parentElement: {
                clientHeight,
                clientWidth
              }
            } = movingElement.elem;
      const deltaX = x - movingElement.x;
      const deltaY = y - movingElement.y;
      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        classList.add('moving');
        style.left = Math.min(Math.max(offsetLeft + deltaX, 0), clientWidth - offsetWidth) + 'px';
        style.top = Math.min(Math.max(offsetTop + deltaY, 0), clientHeight - offsetHeight) + 'px';
        movingElement.x = x;
        movingElement.y = y;
        movingElement.wasMoved = true;
      }
    }

    function handleMouseUp() {
      let {elem} = movingElement;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (movingElement.wasMoved) {
        elem.classList.remove('moving');
        elem.dispatchEvent(new CustomEvent('dragfinish', {
          bubbles: true,
          detail:  {
            movingElement
          }
        }));
        movingElement.wasMoved = false;
      }
    }

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  static randomColor() {
    function c() {
      var hex = "0" + Math.floor(Math.random() * 256).toString(16);
      return hex.substr(-2); // pad with zero
    }

    return {
      r: c(),
      g: c(),
      b: c()
    };
  }

  get center() {
    return {
      y: parseInt(this.elem.style.top) + 50,
      x: parseInt(this.elem.style.left) + 50
    }
  }

  //noinspection JSAnnotator
  set center({x, y}) {
    this.elem.style.top = y - 50 + 'px';
    this.elem.style.left = x - 50 + 'px';
  }
}
class Field {
  constructor(elem) {
    this.elem = elem;
    this.movables = [];
    do {
      this.addCircle(this.getRandomCoords())
    } while (this.movables.length < 10);
    elem.addEventListener('dblclick', this.handleClick.bind(this));
    elem.addEventListener('dragfinish', ({detail}) => this.onDragFinish(detail));
  }

  handleClick({ x, y, target }) {
    const getClickCoords = ({x, y}) => {
      return {
          y: y - this.elem.getBoundingClientRect().top - this.elem.clientTop,
          x: x - this.elem.getBoundingClientRect().left - this.elem.clientLeft
        }
    };
    if (!target.closest('.movable')) {
      this.addCircle(getClickCoords({x, y}));
    } else {
      this.removeCircle(this.movables.find(i => i.elem === target))
    }
  }
  onDragFinish({ movingElement }) {
    const movables = this.movables.filter(i => i !== movingElement);
    const intersect = movables.filter(i => Field.getDist([i, movingElement]) < 25);
    if (intersect.length) {
      const color = Field.mixColor(movingElement, ...intersect);
      this.removeCircle(movingElement, ...intersect);
      this.addCircle(Object.assign({}, { color }, Field.avgCoords(movingElement, ...intersect)));
    }
  }

  static getDist([{center: first}, {center: second}]) {
    return Math.sqrt(Math.pow(first.x - second.x, 2) + Math.pow(first.y - second.y, 2))
  }

  static avgCoords(...circles) {
    return {
      x: circles.reduce((sum,i)=>sum+i.center.x,0)/circles.length,
      y: circles.reduce((sum,i)=>sum+i.center.y,0)/circles.length,
    }
  };

  getRandomCoords() {
    const checkIntersection = ({ x=0, y=0 }) => {
      if (x < 50 || x > 550 || y < 50 || y > 550) return false;
      return this.movables.every(i => Field.getDist([i, {center:{x,y}}]) > 100);
    };
    const random = () => ({
      x: 50 + Math.random() * 500,
      y: 50 + Math.random() * 500
    });
    let coords = {};
    while (!checkIntersection(coords)) {
      coords = random();
    }
    return coords
  }

  static mixColor(...circles) {
    const avgColor = (color) => ~~(circles.reduce((sum, c) => sum + parseInt(c.hexColor[color], 16), 0)/circles.length);
    return Object.keys(circles[0].hexColor).reduce((res, color) =>
      Object.assign(res, {
        [color]: ('0' + avgColor(color).toString(16)).substr(-2)
      }), {});
  }

  addCircle(coords) {
    const circle = new Circle(coords);
    this.movables.push(circle);
    this.elem.appendChild(circle.elem);
  }

  removeCircle(...targets) {
    const findMovable = target => this.movables.indexOf(target);
    targets.forEach(i => this.movables.splice(findMovable(i), 1)[0].elem.remove());
  }

}
new Field(document.querySelector('.field'));

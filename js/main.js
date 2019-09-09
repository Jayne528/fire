
window.onload = function() {

    //環境變數
    var updateFPS = 30;
    var showMouse = true;
    var time = 0;
    var bgcolor = "black";

    //控制
    var controls = {
        value : 0,
        gcount:50,
        ay:-0.2,  //整個環境加速度
        fade: 0.94, //乘 球的半徑  越來越小
        v: 5,
        clearForce: function() {
            Forcefields = [];
        }
    }

    var gui = new dat.GUI();
    gui.add(controls, "gcount", 0, 30).step(1).onChange(function(value) {
    });
    gui.add(controls, "ay", -1, 1).step(0.01).onChange(function(value) {
    });
    gui.add(controls, "fade", 0, 1).step(0.01).onChange(function(value) {
    });
    gui.add(controls, "v", 0, 30).step(0.01).onChange(function(value) {
    });
    gui.add(controls, "clearForce");



    //粒子初始值
    class Particle {
        //args 一個物件 要給他初始值,要先跟使用者指定的值作融合 用Object.assign
        constructor (args) {
            var def = {
                p:new Vec2(), //在classVec2 設定 如果沒設定參數，就指定(0, 0)
                v:new Vec2(1,0),
                a:new Vec2(),
                r: 10,
                color: "#fff"
            }
            Object.assign(def, args);//要先跟使用者指定的值作融合 用Object.assign
            Object.assign(this, def); //把融合過客製化的值放在自己身上，指定到物件上
        }

        draw() {
            cx.save();
                //移動到粒子的位置畫圓
                cx.translate(this.p.x, this.p.y);
                cx.beginPath();
                cx.arc(0, 0, this.r, 0, Math.PI*2);
                cx.fillStyle = this.color;
                cx.fill();
                
            cx.restore();
        }

        update() {
            this.p = this.p.add(this.v);
            this.v = this.v.add(this.a);
            //重力場
            this.v.move(0, controls.ay);
            this.v = this.v.mul(0.99);
            this.r *= controls.fade;
            //邊界檢測
            if (this.p.y + this.r >wh) {
                this.v.y = -Math.abs(this.v.y);
            }
            if (this.p.x + this.r >ww) {
                this.v.x = -Math.abs(this.v.x);
            }
            if (this.p.y - this.r < 0) {
                this.v.y = Math.abs(this.v.y);
            }
            if (this.p.x - this.r < 0) {
                this.v.x = Math.abs(this.v.x);
            }
        }
    }


    //力場
    class Forcefield {
        constructor (args) {
            var def = {
                p: new Vec2(),
                value: -100,  // 正值是斥力 ，負值吸力
            }
            Object.assign(def,args);
            Object.assign(this,def);
        }
        draw() {
            cx.save();
                //移動到粒子的位置畫圓
                cx.translate(this.p.x, this.p.y);
                cx.beginPath();
                //半徑用力場 value
                cx.arc(0, 0, Math.sqrt(Math.abs(this.value)), 0, Math.PI*2);
                cx.fillStyle = "white";
                cx.fill();
                
            cx.restore();
        }
        affect(particle) {
            var delta = particle.p.sub(this.p);
            var len = this.value/(1+delta.length); // 距離0的時候還是會除1
            var force = delta.unit.mul(len);
            particle.v.move(force.x, force.y);
        }
    }

    //--------------vec2 向量------------------

    class Vec2 {
        constructor(x, y){
            this.x = x || 0; //如果沒有給參數，就指定0
            this.y = y || 0;
        }

        set(x, y) {
            this.x = x;
            this.y = y;
        }
        
        move(x, y) {
            this.x += x;
            this.y += y;
        }

        add(v) {
            return new Vec2(this.x + v.x, this.y + v.y)
        }
        sub(v) {
            return new Vec2(this.x - v.x, this.y - v.y)
        }
        mul(s) {
            return new Vec2(this.x*s, this.y*s)
        }

        //新的向量長度
        set length(nv) {
            var temp = this.unit.mul(nv); //this.unit.mul(nv) 是1
            this.set(temp.x, this.y);
        }

        get length() {
            return Math.sqrt(this.x*this.x + this.y*this.y);
        }

        clone() {
            return new Vec2(this.x, this.y);
        }
        //轉成字串
        toString() {
            // return "("+this.x+","+this.y+")";
            return `(${this.x}, ${this.y})`;
        }
        //比較
        equal(){
            return this.x == v.x && this.y == v.y;
        }

        get angle() {
            return Math.atan2(this.y, this.x);
        }

        get unit() {
            return this.mul(1/this.length);
        }


    }
    //------------------------------------------------------------
    var canvas = document.getElementById("canvas");
    var cx = canvas.getContext("2d");
   
    //設定畫圓
    cx.circle = function(v, r) {
        this.arc(v.x, v.y, r, 0, Math.PI*2);
    }
    //設定畫線
    cx.line = function (v1, v2) {
        this.moveTo(v1.x, v1.y);
        this.lineTo(v2.x, v2.y);

    }

    // canvas的設定
    function initCanvas() {
 
        ww = canvas.width = window.innerWidth;
        wh = canvas.height =window.innerHeight;
    }
    initCanvas();


    particles = []; //陣列來裝粒子
    Forcefields = []; //力場

    //邏輯的初始化
    function init() {

    }

    //遊戲邏輯的更新
    function update() {
 
        time++;

        // Array.from({length:5},(d,i)) 產生5個陣列, d 是當下array的值，i是第幾個
        // console.log(Array.from({length: 5},(d, i)=> new Particle()));
        // console.log(Array.from({length: 5},(d, i)=> i));//[0,1,2,3,4]
  
        //連接一個新陣列
        // particles = particles.concat(Array.from({length: controls.gcount},(d, i)=> {

        //     return new Particle({
        //         p: mousePos.clone()
        //     })
        // }))

        particles = particles.concat(Array.from({length: controls.gcount},function(d, i) {

            return new Particle({
                p: mousePos.clone(),
                v: new Vec2(Math.random()*controls.v-controls.v/2,Math.random()*controls.v-5),
                r: Math.random()*10,
                color: `rgb(235,${parseInt(Math.random()*50)},0,${Math.random()*0.8})`,
            })
        }))

        // particles.forEach(p => {p.update()})

        //把太小的球球拿掉
        particles.forEach(function(p) {
            p.update();
        })
        // //相同的陣列再複製一組
        var sp = particles.slice();

        //pid 是陣列的第幾個
        sp.forEach(function(p,pid) {

            //加入力場影響
            Forcefields.forEach(function(f) {
                f.affect(p);
            })

            if(p.r < 0.5) {
                //在pid的位置切掉1個數量,切掉物件還存在
                var pp = sp.splice(pid,1);
                //把pp刪掉  不用刪掉了
                // delete pp;
            }
        })
        //把過濾後的陣列 傳送回去
        particles = sp;

    }

    //畫面更新
    function draw() {

        //清空背景
        cx.fillStyle = bgcolor;
        cx.fillRect(0, 0, ww, wh);

        //----在這繪製--------------------------------

        
        // particles.forEach(p => {p.draw()})
        particles.forEach(function(p) {
            p.draw()
        })

        //劃出力場
        Forcefields.forEach(function(f) {
            f.draw()
        })




        //----------------------------------------

        //滑鼠
        cx.fillStyle = "red";
        cx.beginPath();
        cx.circle(mousePos,3);
        cx.fill();

        //滑鼠線
        cx.save();
            cx.beginPath();
            cx.translate(mousePos.x, mousePos.y);
              
                cx.strokeStyle = "red";
                var len = 20;
                cx.line(new Vec2(-len, 0), new Vec2(len, 0));

                cx.fillText (mousePos, 10, -10);
                cx.rotate(Math.PI/2);
                cx.line(new Vec2(-len, 0), new Vec2(len, 0));
                cx.stroke();

        cx.restore();

        requestAnimationFrame(draw)
    }

    //頁面載完依序呼叫
    function loaded() {

        initCanvas();
        init();
        requestAnimationFrame(draw);
        setInterval(update, 1000/updateFPS);
    }

    // window.addEventListener('load', loaded);
    //頁面縮放
    window.addEventListener('resize', initCanvas);


    //滑鼠 事件更新
    var mousePos = new Vec2(0, 0);
    var mousePosDown = new Vec2(0, 0);
    var mousePosUP = new Vec2(0, 0);

    window.addEventListener("mousemove",mousemove);
    window.addEventListener("mouseup",mouseup);
    window.addEventListener("mousedown",mousedown);
    // 點兩下新增力場
    window.addEventListener("dblclick",dblclick);

    function dblclick(evt) {
        mousePos.set(evt.x, evt.y);
        Forcefields.push(new Forcefield({
            p: mousePos.clone(),
        }))

    }

    function mousemove(evt) {

        // mousePos.set(evt.offsetX, evt.offsetY);
        mousePos.set(evt.x, evt.y);
        

    }
    function mouseup(evt) {
        // mousePos.set(evt.offsetX, evt.offsetY);
        mousePos.set(evt.x, evt.y);
        mousePosUP = mousePos.clone();
        
    }
    function mousedown(evt) {
        // mousePos.set(evt.offsetX, evt.offsetY);
        mousePos.set(evt.x, evt.y);
        mousePosDown = mousePos.clone();
    }

    loaded();
}

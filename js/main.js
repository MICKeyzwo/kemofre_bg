window.addEventListener("load", () => {
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    const canvas2 = document.createElement("canvas");
    const ctx2 = canvas2.getContext("2d");

    var scale = new InputSyncer(document.getElementById("scale").getElementsByTagName("input"),
        {
            min: 0.1,
            max: 2,
            step: 0.05
        }
    );
    scale.setValue(1);
    scale.on("input", render);
    var rad_size = new InputSyncer(document.getElementById("rad").getElementsByTagName("input"),
        {
            min: 0,
            max: 50,
            step: 1
        }
    );
    rad_size.setValue(20);
    rad_size.on("input", render);
    var margin = new InputSyncer(document.getElementById("margin").getElementsByTagName("input"),
        {
            min: 0,
            max: 50,
            step: 1
        }
    );
    margin.setValue(20);
    margin.on("input", render);
    var color = document.getElementById("color");
    color.addEventListener("change", render);

    var image = new Image();
    var renderdImage = new Image();
    var file = document.getElementById("file");
    file.addEventListener("change", e => {
        changed = false;
        var fr = new FileReader();
        fr.readAsDataURL(e.target.files[0]);
        fr.addEventListener("load", res => {
            image.addEventListener("load", e => {
                render();
            })
            image.src = fr.result;
        });
    });

    var imageProccessing = function (e) {
        var imd = e.data;
        var next = new Uint8Array(imd.data.length), ind, avg = 0;
        console.log(imd.width);
        for (var i = 0; i < imd.height; i++) {
            for (var j = 0; j < imd.width; j++) {
                for (var k = 0; k < 4; k++) {
                    avg = 0;
                    for (var dy = -1; dy < 2; dy++) {
                        for (var dx = -1; dx < 2; dx++) {
                            if(i + dy < 0 || i + dy >= imd.height || j + dx < 0 || j + dx >= imd.width) continue;
                            ind = ((i + dy) * imd.width + j + dx) * 4;
                            avg += imd.data[ind + k];
                        }
                    }
                    next[(i * imd.width + j) * 4] = avg / 9;
                }
            }
        }
        console.log(avg);
        imd.data = next;
        var res = imd;
        self.postMessage({ res: res });
    }

    var worker = new Worker(
        `data:text/javascript,self.addEventListener("message",
        ${imageProccessing.toString()})`
    );

    var changed = false;

    function render() {
        if (!changed) {
            changed = true;
            worker.addEventListener("message", function (e) {
                ctx2.putImageData(e.data.res, 0, 0);
                renderdImage.addEventListener("load", () => draw(renderdImage));
                renderdImage.src = canvas2.toDataURL();
            });
            rad_size.setAttribute("max", (Math.min(image.width, image.height) * 0.5) | 0);
            margin.setAttribute("max", (Math.min(image.width, image.height) * 0.3) | 0);
            canvas2.width = image.width;
            canvas2.height = image.height;
            ctx2.drawImage(image, 0, 0);
            data = ctx2.getImageData(0, 0, canvas2.width, canvas2.height);
            worker.postMessage(data);
        } else {
            draw(renderdImage);
        }
    }
    function draw(img) {
        canvas2.width = image.width;
        canvas2.height = image.height;
        ctx2.drawImage(img, 0, 0);
        var imd = ctx2.getImageData(0, 0, canvas2.width, canvas2.height);
        var sx, sy, ox, oy, mar = +margin.value, size = +rad_size.value, ind;
        for (var i = 0; i < 4; i++) {
            sx = i % 2 == 0 ? 0 : image.width - size;
            sy = i < 2 ? 0 : image.height - size;
            ox = i % 2 == 0 ? size : image.width - size;
            oy = i < 2 ? size : image.height - size;
            for (var j = sy; j < sy + size; j++) {
                for (var k = sx; k < sx + size; k++) {
                    if (Math.sqrt(Math.pow(oy - j, 2) + Math.pow(ox - k, 2)) > size) {
                        imd.data[(image.width * j + k) * 4 + 3] = 0;
                    }
                }
            }
        }
        ctx2.putImageData(imd, 0, 0);
        var dim = new Image();
        dim.src = canvas2.toDataURL();
        dim.addEventListener("load", () => {
            canvas.width = image.width * +scale.value + (mar * 2);
            canvas.height = image.height * +scale.value + (mar * 2);
            ctx.fillStyle = color.value;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(dim, 0, 0, image.width, image.height, mar, mar,
                image.width * +scale.value, image.height * +scale.value);
        })
    }

});

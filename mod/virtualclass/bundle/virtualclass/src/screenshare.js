/**@Copyright 2014  Vidyamantra Edusystems. Pvt.Ltd.
 * @author  Suman Bogati <http://www.vidyamantra.com>
 * @author  Jai Gupta
  */

(function (window) {
    function callback(error) {
        vApp.vutil.initInstallChromeExt(error);
    }
    
    var studentScreen = function (){
        return {
            ssProcess : function (data_pack, msg, stype, sTool){
                if(data_pack[0] == 102 || data_pack[0] == 202) { //full image
                    var data_pack = new Uint8ClampedArray(msg);
                    var w = vApp.vutil.numValidateTwo(data_pack[1],data_pack[2]);
                    var h = vApp.vutil.numValidateTwo(data_pack[3],data_pack[4]);
                    var recmsg = data_pack.subarray(5,data_pack.length);
                    this.initStudentScreen(recmsg, {w:w, h:h}, stype, sTool);
                    return;
                }else if(data_pack[0] == 103 || data_pack[0] == 203) { //slice image
                    var data_pack = new Uint8ClampedArray(msg);
                    var s = 7;
                    for (var i = 0; (i+7) <= data_pack.length;i=l+1) {
                        var x = vApp.vutil.numValidateTwo(data_pack[i+1],data_pack[i+2]);
                         var y = vApp.vutil.numValidateTwo(data_pack[i+3],data_pack[i+4]);
                         var h = parseInt(data_pack[i+5]);
                         var w = parseInt(data_pack[i+6]);
                         var l = s+(h*w)-1;
                         var recmsg = data_pack.subarray(s,l+1);
                         var d = { x:x, y : y, w :w, h : h };
                         this.initStudentScreen(recmsg, d, stype, sTool);
                         s=l+7+1;
                     }
                     return;
                }else if (data_pack[0] == 104 || data_pack[0] == 204){ //full image with resize
                    var data_pack = new Uint8ClampedArray(msg);
                    var dw = vApp.vutil.numValidateTwo(data_pack[1],data_pack[2]);
                    var dh = vApp.vutil.numValidateTwo(data_pack[3],data_pack[4]);
                    var vcw = vApp.vutil.numValidateTwo(data_pack[5],data_pack[6]);
                    var vch = vApp.vutil.numValidateTwo(data_pack[7],data_pack[8]);
                    var recmsg = data_pack.subarray(9,data_pack.length);
                    var dimObj = { d : {w : dw, h : dh},  vc : {w : vcw, h : vch}};
                    this.initStudentScreen(recmsg, dimObj, stype, sTool);
                    return;
                }
            },
            
            initStudentScreen : function (imgData, d, stype, stool){
                vApp.vutil.addClass('audioWidget', "fixed");
                app = stype;
                if(typeof vApp[app] != 'object' ){
                     if(typeof vtype != 'undefined'){
                         vApp.recorder.recImgPlay = true;
                     }
                     vApp.makeAppReady(stool);
                }else{
                     var prvScreen = document.getElementById(vApp.previous);
                     if(prvScreen != null){
                         prvScreen.style.display = 'none';
                         document.getElementById(vApp[app].id).style.display = 'block';
                     }
                }

                if(d.hasOwnProperty('d')){
                    vApp[app].dimensionStudentScreenResize(d);
                    dim = true
                    vApp[app].drawImages(imgData);
                }else{
                    if(typeof dim == 'undefined' || ((typeof prvWidth != 'undefined') && (prvWidth != d.w) && (!d.hasOwnProperty('x')))){
                        dim = true
                        vApp[app].dimensionStudentScreen(d.w, d.h);
                        prvWidth = d.w;
                        prvHeight = d.h;
                    }

                    if(d.hasOwnProperty('x')){
                        vApp[app].drawImages(imgData, d);
                    }else{
                        if(d.hasOwnProperty('w')){
                           vApp[app].localCanvas.width = d.w;
                           vApp[app].localCanvas.height = d.h;
                        }
                        vApp[app].drawImages(imgData);
                    }
                }

                vApp.previous = vApp[app].id;
            }
        }
    }
    
    var screenShare = function (config) {
        vApp.getSceenFirefox = function () {
            var ffver = parseInt(window.navigator.userAgent.match(/Firefox\/(.*)/)[1], 10);
            if (ffver >= 33) {
                constraints = {
                    video: {
                        mozMediaSource: 'window',
                        mediaSource: 'window'
                    }
                };
                vApp.adpt = new vApp.adapter();
                navigator2 = vApp.adpt.init(navigator);
                navigator2.getUserMedia(constraints, function (stream, err) {
                        //callback(err, stream);
                        vApp.ss._init();
                        vApp.ss.initializeRecorder.call(vApp.ss, stream);

                        // workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=1045810
                        if (typeof err == 'undefined') {
                            var lastTime = stream.currentTime;
                            var polly = window.setInterval(function () {
                                if (!stream) window.clearInterval(polly);
                                if (stream.currentTime == lastTime) {
                                    window.clearInterval(polly);
                                    if (stream.onended) {
                                        stream.onended();
                                    }
                                }
                                lastTime = stream.currentTime;
                            }, 500);
                        }
                    },

                    function (error) {
                        if (typeof error == 'string') {
                            //PERMISSION_DENIED
                            if (error === 'PERMISSION_DENIED') {
                                //this url is need to be changed
                                window.open("https://addons.mozilla.org/en-US/firefox/addon/ff_screenshare/").focus();
                            }
                        }
                    }
                );
            } else {
                alert(vApp.lang.getString('notSupportBrowser'));
            }
        };
        
        return {
            prevStream: false,
            init: function (screen) {

                this.type = screen.type;
                this.ssByClick = true;
                this.manualStop = false;
                //if(vApp.gObj.uRole == 't' && !vApp.hasOwnProperty('repType')){
                if (vApp.gObj.uRole == 't' && !vApp.recorder.recImgPlay) {
                    //if(!vApp.hasOwnProperty('repType')){
                    this.readyTostart(screen.app);
                    //}
                } else {
                    this._init();
                }
            },

            //called when user select the screencall
            _init: function () {
                if (vApp.previous != config.id) {
                    document.getElementById(vApp.previous).style.display = 'none';
                    vApp.previous = config.id;
                }

                var ss = document.getElementById(config.id);
                if (ss != null) {
                    ss.style.display = 'block';
                }

                if (!this.hasOwnProperty('id')) {
                    this.dc = vApp.dirtyCorner;
                    this.postFix = "Cont";
                    this.id = config.hasOwnProperty('id') ? config.id : "vAppScreenShare";
                    this.className = "vmApp";
                    this.label = "Local",
                    this.local = this.id + this.label;
                    this.localTemp = this.id + this.label + "Temp";
                    this.classes = config.hasOwnProperty('class') ? config.classes : "";

                    //this.prevImageSlices = [];
                    this.initPrevImage();
                    var ssUI = document.getElementById(this.id);
                    if (ssUI != null) {
                        ssUI.parentNode.removeChild(ssUI);
                    }
                    ssUI = this.html.UI.call(this, vApp.gObj.uRole);
                    var beforeAppend = document.getElementById(vApp.rWidgetConfig.id);
                    document.getElementById(vApp.html.id).insertBefore(ssUI, beforeAppend);
                    if (vApp.gObj.uRole == 't' && !vApp.recorder.recImgPlay) {
                        vApp.vutil.initLocCanvasCont(this.localTemp + "Video");
                    }
                }
            },

            readyTostart: function (app) {
                if (app == vApp.apps[1]) {
                    this.getScreen();
                } 
//                else if (app == vApp.apps[2]) {
//                    this.wholeScreen();
//                }
            },

            onError: function (e) {
                console.log("Error " + e);
            },

            getScreen: function (callback) {
                if (vApp.system.mybrowser.name == 'Chrome') {
                    if (vApp.gObj.hasOwnProperty('ext') && vApp.gObj.ext) {
                        window.postMessage({type: 'getScreen', id: 1}, '*');
                    } else {
                        var url = 'https://chrome.google.com/webstore/detail/' + 'ijhofagnokdeoghaohcekchijfeffbjl';
                        chrome.webstore.install(url, function () {
                            window.location.reload();
                            });
                    }
                } else if (vApp.system.mybrowser.name == 'Firefox') {
                    vApp.getSceenFirefox();
                }
            },

            unShareScreen: function () {
                this.video.src = "";
                this.localtempCont.clearRect(0, 0, this.localtempCanvas.width, this.localtempCanvas.height);
                clearInterval(vApp.clear);
                //this.prevImageSlices = [];
                this.initPrevImage();

                if (this.hasOwnProperty('currentStream')) {
                    this.currentStream.stop();
                }

                vApp.wb.utility.beforeSend({'unshareScreen': true, st: this.type});
            },

            removeStream: function () {
                vApp.vutil.removeClass('audioWidget', "fixed");
                this.localCont.clearRect(0, 0, this.localCanvas.width, this.localCanvas.height);
            },

            initializeRecorder: function (stream) {
                vApp.vutil.addClass("audioWidget", "fixed");
                changeonresize = 1;
                resizecalled = 0;

                if (this.prevStream) {
                    this.ssByClick = false;
                }

                if (typeof vApp.prevScreen != 'undefined') {
                    if (vApp.prevScreen.hasOwnProperty('currentStream')) {
                        vApp.prevScreen.unShareScreen();
                    }
                }

                this.video = document.getElementById(this.local + "Video");

                if (this.video.tagName != "VIDEO") {
                    var earlierVideo = this.video;
                    var video = document.createElement('video');
                    video.id = earlierVideo.id;
                    this.video.parentNode.replaceChild(video, this.video);

                    this.video = document.getElementById(this.local + "Video");
                    this.video.autoplay = true;
                    vApp.vutil.createLocalTempVideo("vAppScreenShare", this.local + "Temp");
                    vApp.vutil.initLocCanvasCont(this.local + "Temp" + "Video");
                }
                this.currentStream = stream;
                var that = this;

                console.log("video changed");

                vApp.adpt.attachMediaStream(this.video, stream);
                this.prevStream = true;

                this.currentStream.onended = function (name) {
                    if (that.ssByClick) {
                        that.video.src = "";
                        that.localtempCont.clearRect(0, 0, that.localtempCanvas.width, that.localtempCanvas.height);
                        clearInterval(vApp.clear);
                        //that.prevImageSlices = [];
                        that.initPrevImage();
                        vApp.wb.utility.beforeSend({'unshareScreen': true, st: that.type});
                        that.prevStream = false;
                        that.prevScreen = "";
                        vApp.prevScreen = ""; //todo:- that.prevScreen and vApp.prevScreen should be same
                    } else {
                        that.ssByClick = true;
                    }
                }

                var container = {};
                container.width = window.innerWidth;
                container.height = window.innerHeight - 140;

                var vidContainer = document.getElementById(this.local);
                var dimension = this.html.getDimension(container);
                vidContainer.style.width = Math.round(dimension.width) + "px";
                vidContainer.style.height = Math.round(dimension.height) + "px";

                //setStyleToElement(vidContainer, width, height);
                var that = this;
                var video;
                this.video.onloadedmetadata = function () {

                    that.width = dimension.width;
                    that.height = dimension.height;

                    that.localtempCanvas.width = that.video.offsetWidth;
                    that.localtempCanvas.height = that.video.offsetHeight;

                    vApp.prevScreen = that;
                    var res = vApp.system.measureResoultion({'width': window.innerWidth, 'height': window.innerHeight});

                    that.sharing();
                    vApp.vutil.setContainerWidth(res);

                    if (vApp.gObj.uRole == 't') {
                        vApp.vutil.makeActiveApp(that.id, vApp.prevApp);
                    }
                    vApp.prevApp = that.id;
                }
            },
            sharing: function () {
                var tempObj, encodedData, stringData, d, matched, imgData;
                var resA = Math.round(this.localtempCanvas.height / 12);
                var resB = Math.round(this.localtempCanvas.width / 12);
                var that = this;
                var uniqcount = 0;
                var uniqmax = (resA * resB) / 5;
                var sendObj;
                //var changeonresize=1;
                randomTime = Math.floor(Math.random() * (15000 - 5000 + 1)) + 5000;
                if (vApp.hasOwnProperty('wholeImage')) {
                    clearInterval(vApp.wholeImage);
                }

                if (vApp.hasOwnProperty('clear')) {
                    clearInterval(vApp.clear);
                }

                var screenIntervalTime = 1000;
                var pscreenIntervalTime = 1000;

                vApp.getDataFullScreen = function (type) {
                    that.localtempCanvas.width = that.video.offsetWidth;
                    that.localtempCanvas.height = that.video.offsetHeight;
                    that.localtempCont.drawImage(that.video, 0, 0, that.video.offsetWidth, that.video.offsetHeight);

                    //if(typeof firstTimeDisp == 'undefined'){
                    var imgData = that.localtempCont.getImageData(0, 0, that.localtempCanvas.width, that.localtempCanvas.height);

                    var encodedData = that.dc.encodeRGB(imgData.data);
                    var h = breakintobytes(that.localtempCanvas.height, 4);
                    var w = breakintobytes(that.localtempCanvas.width, 4);
                    var statusCode = null;
                    statusCode = (type == 'ss') ? 102 : 202;
                    var scode = new Uint8ClampedArray([statusCode, w[0], w[1], h[0], h[1]]);

                    var sendmsg = new Uint8ClampedArray(encodedData.length + scode.length);
                    sendmsg.set(scode);
                    sendmsg.set(encodedData, scode.length);
                    return sendmsg;
                };

                function getDataFullScreenResize(stype) {
                    that.localtempCanvas.width = that.video.offsetWidth;
                    that.localtempCanvas.height = that.video.offsetHeight;
                    that.localtempCont.drawImage(that.video, 0, 0, that.video.offsetWidth, that.video.offsetHeight);

                    var imgData = that.localtempCont.getImageData(0, 0, that.localtempCanvas.width, that.localtempCanvas.height);
                    var encodedData = that.dc.encodeRGB(imgData.data);

                    var wdw = Math.round((that.localtempCanvas.width) / resB);
                    var wdh = Math.round((that.localtempCanvas.height) / resA);

                    var contDimension = that.getContainerDimension();
                    if (typeof prvVWidth != 'undefined' && typeof prvVHeight != 'undefined') {
                        var dw = breakintobytes(prvVWidth, 4);
                        var dh = breakintobytes(prvVHeight, 4);
                        var vcw = breakintobytes(contDimension.width, 4);
                        var vch = breakintobytes(contDimension.height, 4);
                    } else {
                        var dw = breakintobytes(that.video.offsetWidth, 4);
                        var dh = breakintobytes(that.video.offsetHeight, 4);
                        var vcw = breakintobytes(contDimension.width, 4);
                        var vch = breakintobytes(contDimension.height, 4);
                    }

                    var appCode = (stype == 'ss' ) ? 104 : 204;
                    var scode = new Uint8ClampedArray([appCode, dw[0], dw[1], dh[0], dh[1], vcw[0], vcw[1], vch[0], vch[1]]);
                    var sendmsg = new Uint8ClampedArray(encodedData.length + scode.length);
                    sendmsg.set(scode);
                    sendmsg.set(encodedData, scode.length);
                    if (!!window.Worker) {
                        sworker.postMessage({
                            img: encodedData,
                            resize: 1,
                            resA: resA,
                            resB: resB,
                            dw: wdw,
                            dh: wdh,
                            offsetWidth: that.video.offsetWidth,
                            offsetHeight: that.video.offsetHeight
                        }, [encodedData.buffer]);
                    }
                    return sendmsg;
                }

                function breakintobytes(val, l) {
                    var numstring = val.toString();
                    for (var i = numstring.length; i < l; i++) {
                        numstring = '0' + numstring;
                    }
                    var parts = numstring.match(/[\S]{1,2}/g) || [];
                    return parts;
                }

                function sendScreen() {
                    clearInterval(vApp.clear);
                    if (typeof prvVWidth != 'undefined' && typeof prvVHeight != 'undefined') {
                        if (prvVWidth != that.video.offsetWidth || prvVHeight != that.video.offsetHeight) {
                            changeonresize = 1;
                        }
                    } else {
                        prvVWidth = that.video.offsetWidth;
                        prvVHeight = that.video.offsetHeight;
                    }

                    if (changeonresize == 1) {
                        setTimeout(sendResizeWindow, 2000);
                    } else {
                        sendDataImageSlices(that.type);
                    }
                }

                function calcBandwidth(localBandwidth) {
                    if (localBandwidth <= 400 || typeof localBandwidth == 'undefined') {
                        screenIntervalTime = 400;
                    } else if (localBandwidth >= 10000) {
                        screenIntervalTime = localBandwidth / 2;
                    }
                    else {
                        screenIntervalTime = localBandwidth;
                    }
                    // Avoid Sharp Curve
                    if ((pscreenIntervalTime * 4) < screenIntervalTime) {
                        screenIntervalTime = pscreenIntervalTime * 4;
                    }
//                    console.log ('Bandwidth '+ localBandwidth+'Kbps' + 'New Time ' + screenIntervalTime);
                    if (screenIntervalTime > 400) {
                        console.trace();
                    }
                    pscreenIntervalTime = screenIntervalTime;
                }

                function sendResizeWindow() {
                    console.log('RESIZE');
                    prvVWidth = that.video.offsetWidth;
                    prvVHeight = that.video.offsetHeight;
                    resA = Math.round(that.localtempCanvas.height / 12);
                    resB = Math.round(that.localtempCanvas.width / 12);
                    var createdImg = getDataFullScreenResize(that.type);
                    io.sendBinary(createdImg);
                    calcBandwidth(createdImg.length / 128); // In Kbps
                    changeonresize = 0;
                    clearInterval(vApp.clear);
//                    console.log ('RESIZE Bandwidth '+ (createdImg.length / 128)+'Kbps' + 'New Time ' + screenIntervalTime);
                    vApp.clear = setInterval(sendScreen, screenIntervalTime);
                }

                function w(val, l) {
                    var numstring = val.toString();
                    for (var i = numstring.length; i < l; i++) {
                        numstring = '0' + numstring;
                    }
                    var parts = numstring.match(/[\S]{1,2}/g) || [];
                    return parts;
                }

                function sendDataImageSlices(type) {
                    var localBandwidth = 0;
                    that.localtempCanvas.width = that.video.offsetWidth;
                    that.localtempCanvas.height = that.video.offsetHeight;
                    //can be problem for crash
                    that.localtempCont.drawImage(that.video, 0, 0, that.video.offsetWidth, that.video.offsetHeight);
                    var needFullScreen = 0;
                    var dw = Math.round((that.localtempCanvas.width) / resB);
                    var dh = Math.round((that.localtempCanvas.height) / resA);
                    var x, y, cx, cy = 0;

                    var masterImgData = that.localtempCont.getImageData(0, 0, that.video.offsetWidth, that.video.offsetHeight);

                    if (!!window.Worker) {
                        sworker.postMessage({
                            img: masterImgData.data,
                            resA: resA,
                            resB: resB,
                            dw: dw,
                            dh: dh,
                            offsetWidth: that.video.offsetWidth,
                            offsetHeight: that.video.offsetHeight,
                            type: that.type
                        }, [masterImgData.data.buffer]);

                        sworker.onmessage = function (e) {

                            if (e.data.needFullScreen == 1) { //sending full screen here
                                var createdImg = vApp.getDataFullScreen(that.type);
                                io.sendBinary(createdImg);
                                var localBandwidth = (createdImg.length / 128); // In Kbps
                            } else if (e.data.masterSlice != null) {
                                io.sendBinary(e.data.masterSlice);
                                var localBandwidth = (e.data.masterSlice.length / 128); // In Kbps
                            }
                            calcBandwidth(localBandwidth);
                        }

                    }
                    clearInterval(vApp.clear);
                    vApp.clear = setInterval(sendScreen, screenIntervalTime);
                }
                clearInterval(vApp.clear);
                vApp.clear = setInterval(sendScreen, screenIntervalTime);
            },
            getContainerDimension: function () {
                var vidCont = document.getElementById(this.id + "Local");
                return {width: vidCont.offsetWidth, height: vidCont.offsetHeight};
            },
            drawImages: function (rec, d) {
                if (typeof d != 'undefined') {
                    var imgData = this.dc.decodeRGBSlice(rec, this.localCont, d);
                    this.localCont.putImageData(imgData, d.x, d.y);
                } else {
                    var imgData = this.dc.decodeRGB(rec, this.localCont, this.localCanvas);
                    this.localCont.putImageData(imgData, 0, 0);
                }

            },
            drawSingleImage: function (rec) {
                var imgData = this.dc.decodeRGB(rec, this.localCont, this.localCanvas);
                this.localCont.putImageData(imgData, 0, 0);
            },
            dimensionStudentScreen: function (cWidth, cHeight) {
                this.localCanvas = document.getElementById(vApp[app].local + "Video");
                this.localCont = vApp[app].localCanvas.getContext('2d');
                this.localCanvas.width = cWidth;
                this.localCanvas.height = cHeight;
                console.log("normal width " + this.localCanvas.width);
            },
            dimensionStudentScreenResize: function (msg, vtype) {
                if (!this.hasOwnProperty('vac')) {
                    this.vac = true;
                    this.localCanvas = document.getElementById(vApp[app].local + "Video");
                    this.localCont = vApp[app].localCanvas.getContext('2d');
                }

                if (msg.hasOwnProperty('d')) {
                    this.localCont.clearRect(0, 0, this.localCanvas.width, this.localCanvas.height);
                    this.localCanvas.width = msg.d.w;
                    this.localCanvas.height = msg.d.h;
                }

                if (msg.hasOwnProperty('vc')) {
                    var vc = document.getElementById(vApp[app].local);
                    vc.style.width = msg.vc.w + "px";
                    vc.style.height = msg.vc.h + "px";
                }

                if (vApp.previous != 'vAppWhiteboard') {
                    vApp.vutil.setScreenInnerTagsWidth(vApp.previous);
                }
            },
            html: {
                UI: function (user) {
                    var mainCont = vApp.vutil.createDOM("div", this.id, [this.className]);
                    var locVidCont = vApp.vutil.createDOM("div", this.local, [this.label]);
                    if ((user == 't')) {

                        //if(vApp.hasOwnProperty('repType')){
                        if (vApp.recorder.recImgPlay) {
                            var vidCont = vApp.vutil.createDOM("canvas", this.local + "Video");
                            //vidCont.setAttribute("autoplay", true);
                        } else {
                            var vidCont = vApp.vutil.createDOM("video", this.local + "Video");
                            vidCont.setAttribute("autoplay", true);
                        }

                        css(locVidCont, "position:relative");

                    } else {
                        var vidCont = vApp.vutil.createDOM("canvas", this.local + "Video");
                    }

                    locVidCont.appendChild(vidCont);
                    mainCont.appendChild(locVidCont);

                    if (user == 't' && !vApp.recorder.recImgPlay) {
                        vApp.vutil.createLocalTempVideo(mainCont, this.localTemp);
                    }

                    function css(element, styles) {
                        if (typeof styles == 'string') {
                            element.style.cssText += ';' + styles;
                        }
                    }

                    return mainCont;
                },
                getDimension: function (container, aspectRatio) {
                    var aspectRatio = aspectRatio || (3 / 4),
                        height = (container.width * aspectRatio),
                        res = {};

                    return {
                        height: container.height,
                        width: container.width
                    };
                }
            },
            
            initPrevImage : function (){
                sworker.postMessage({'initPrevImg' : true});
            }
        }
        
        
        
    }
    window.studentScreen = studentScreen;
    window.screenShare = screenShare;
})(window);

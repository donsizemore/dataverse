(function () {
    var C, a, s, x, d, w, e, f, n, j, y, k, o, m, p, t, v, c, i, q, r, h, l, B, A, z, g, u = [].slice, b = [].indexOf || function (F) {
        for (var E = 0, D = this.length; E < D; E++) {
            if (E in this && this[E] === F) {
                return E
            }
        }
        return -1
    };
    if (window.Dropbox == null) {
        window.Dropbox = {}
    }
    if (Dropbox.baseUrl == null) {
        Dropbox.baseUrl = "https://www.dropbox.com"
    }
    if (Dropbox.blockBaseUrl == null) {
        Dropbox.blockBaseUrl = "https://dl.dropbox.com"
    }
    Dropbox.addListener = function (F, E, D) {
        if (F.addEventListener) {
            F.addEventListener(E, D, false)
        } else {
            F.attachEvent("on" + E, function (G) {
                G.preventDefault = function () {
                    return this.returnValue = false
                };
                return D(G)
            })
        }
    };
    Dropbox.removeListener = function (F, E, D) {
        if (F.removeEventListener) {
            F.removeEventListener(E, D, false)
        } else {
            F.detachEvent("on" + E, D)
        }
    };
    x = function (E) {
        var F, D;
        D = encodeURIComponent(Dropbox.VERSION);
        F = E.indexOf("?") === -1 ? "?" : "&";
        return"" + E + F + "version=" + D
    };
    w = function (N, I) {
        var L, J, H, D, G, M, F, E, K;
        M = encodeURIComponent(window.location.protocol + "//" + window.location.host);
        L = encodeURIComponent(Dropbox.appKey);
        D = encodeURIComponent(N.linkType || "");
        F = encodeURIComponent(N._trigger || "js");
        G = Boolean(N.multiselect);
        J = encodeURIComponent(((K = N.extensions) != null ? typeof K.join === "function" ? K.join(" ") : void 0 : void 0) || "");
        H = Boolean(N.folderselect);
        I = Boolean(I);
        E = "" + Dropbox.baseUrl + "/chooser?origin=" + M + "&app_key=" + L + "&link_type=" + D;
        E += "&trigger=" + F + "&multiselect=" + G + "&extensions=" + J + "&folderselect=" + H + "&iframe=" + I;
        return x(E)
    };
    B = function (F) {
        var G, D, E;
        D = encodeURIComponent(window.location.protocol + "//" + window.location.host);
        G = encodeURIComponent(Dropbox.appKey);
        E = "" + Dropbox.baseUrl + "/saver?origin=" + D + "&app_key=" + G;
        return x(E)
    };
    i = 1;
    m = function (E, G) {
        var I, F, H, D;
        I = encodeURIComponent(Dropbox.appKey);
        D = "" + Dropbox.baseUrl + "/dropins/job_status?job=" + G + "&app_key=" + I;
        D = x(D);
        H = function (K) {
            var J;
            if (K.status === "COMPLETE") {
                if (typeof E.progress === "function") {
                    E.progress(1)
                }
                if (typeof E.success === "function") {
                    E.success()
                }
            } else {
                if ((J = K.status) === "PENDING" || J === "DOWNLOADING") {
                    if (K.progress != null) {
                        if (typeof E.progress === "function") {
                            E.progress(K.progress / 100)
                        }
                    }
                    setTimeout(F, 1500)
                } else {
                    if (K.status === "FAILED") {
                        if (typeof E.error === "function") {
                            E.error(K.error)
                        }
                    }
                }
            }
        };
        if ("withCredentials" in new XMLHttpRequest()) {
            F = function () {
                var J;
                J = new XMLHttpRequest();
                J.onload = function () {
                    return H(JSON.parse(J.responseText))
                };
                J.onerror = function () {
                    return typeof E.error === "function" ? E.error() : void 0
                };
                J.open("GET", D, true);
                return J.send()
            }
        } else {
            if (!Dropbox.disableJSONP) {
                F = function () {
                    var L, K, J;
                    L = "DropboxJsonpCallback" + i++;
                    K = false;
                    window[L] = function (M) {
                        K = true;
                        return H(M)
                    };
                    J = document.createElement("script");
                    J.src = "" + D + "&callback=" + L;
                    J.onreadystatechange = function () {
                        var M;
                        if (J.readyState === "loaded") {
                            if (!K) {
                                if (typeof E.error === "function") {
                                    E.error()
                                }
                            }
                            return(M = J.parentNode) != null ? M.removeChild(J) : void 0
                        }
                    };
                    return document.getElementsByTagName("head")[0].appendChild(J)
                }
            } else {
                if ((typeof XDomainRequest !== "undefined" && XDomainRequest !== null) && "https:" === document.location.protocol) {
                    F = function () {
                        var J;
                        J = new XDomainRequest();
                        J.onload = function () {
                            return H(JSON.parse(J.responseText))
                        };
                        J.onerror = function () {
                            return typeof E.error === "function" ? E.error() : void 0
                        };
                        J.open("get", D);
                        return J.send()
                    }
                } else {
                    throw new Error("Unable to find suitable means of cross domain communication")
                }
            }
        }
        if (typeof E.progress === "function") {
            E.progress(0)
        }
        return F()
    };
    p = function (D, I, F) {
        var H, E, G;
        H = JSON.parse(D.data);
        switch (H.method) {
            case"ready":
                if (F.files != null) {
                    G = JSON.stringify({method: "files", params: F.files});
                    if ((typeof t !== "undefined" && t !== null) && F._popup) {
                        E = t.contentWindow
                    } else {
                        E = D.source
                    }
                    E.postMessage(G, Dropbox.baseUrl)
                }
                if (typeof F.ready === "function") {
                    F.ready()
                }
                break;
            case"files_selected":
            case"files_saved":
                if (typeof I === "function") {
                    I()
                }
                if (typeof F.success === "function") {
                    F.success(H.params)
                }
                break;
            case"progress":
                if (typeof F.progress === "function") {
                    F.progress(H.params)
                }
                break;
            case"close_dialog":
                if (typeof I === "function") {
                    I()
                }
                if (typeof F.cancel === "function") {
                    F.cancel()
                }
                break;
            case"web_session_error":
                if (typeof I === "function") {
                    I()
                }
                if (typeof F.webSessionFailure === "function") {
                    F.webSessionFailure()
                }
                break;
            case"web_session_unlinked":
                if (typeof I === "function") {
                    I()
                }
                if (typeof F.webSessionUnlinked === "function") {
                    F.webSessionUnlinked()
                }
                break;
            case"resize":
                if (typeof F.resize === "function") {
                    F.resize(H.params)
                }
                break;
            case"error":
                if (typeof I === "function") {
                    I()
                }
                if (typeof F.error === "function") {
                    F.error(H.params)
                }
                break;
            case"job_id":
                if (typeof I === "function") {
                    I()
                }
                m(F, H.params);
                break;
            case"_debug_log":
                if (typeof console !== "undefined" && console !== null) {
                    console.log(H.params.msg)
                }
            }
    };
    t = null;
    f = function () {
        if (/\bTrident\b/.test(navigator.userAgent)) {
            t = document.createElement("iframe");
            t.setAttribute("id", "dropbox_xcomm");
            t.setAttribute("src", Dropbox.baseUrl + "/static/api/1/xcomm.html");
            t.style.display = "none";
            document.getElementsByTagName("body")[0].appendChild(t)
        }
    };
    Dropbox.createChooserWidget = function (D) {
        var E;
        E = n(w(D, true));
        E._handler = function (F) {
            if (F.source === E.contentWindow && F.origin === Dropbox.baseUrl) {
                p(F, null, D)
            }
        };
        Dropbox.addListener(window, "message", E._handler);
        return E
    };
    Dropbox.cleanupWidget = function (D) {
        if (!D._handler) {
            throw new Error("Invalid widget!")
        }
        Dropbox.removeListener(window, "message", D._handler);
        delete D._handler
    };
    l = function (D, E) {
        var G, F;
        G = (window.screenX || window.screenLeft) + ((window.outerWidth || document.documentElement.offsetWidth) - D) / 2;
        F = (window.screenY || window.screenTop) + ((window.outerHeight || document.documentElement.offsetHeight) - E) / 2;
        return"width=" + D + ",height=" + E + ",left=" + G + ",top=" + F
    };
    if (Dropbox._dropinsjs_loaded) {
        if (typeof console !== "undefined" && console !== null) {
            if (typeof console.warn === "function") {
                console.warn("dropins.js included more than once")
            }
        }
        return
    }
    Dropbox._dropinsjs_loaded = true;
    if (Dropbox.appKey == null) {
        Dropbox.appKey = (g = document.getElementById("dropboxjs")) != null ? g.getAttribute("data-app-key") : void 0
    }
    z = function (D) {
        return D
    };
    C = "https://www.dropbox.com/developers/dropins/chooser/js";
    s = ["text", "documents", "images", "video", "audio"];
    Dropbox.init = function (D) {
        if (D.translation_function != null) {
            z = D.translation_function
        }
        if (D.appKey != null) {
            Dropbox.appKey = D.appKey
        }
    };
    n = function (D) {
        var E;
        E = document.createElement("iframe");
        E.src = D;
        E.style.display = "block";
        E.style.backgroundColor = "white";
        E.style.border = "none";
        return E
    };
    h = function (J) {
        var F, D, L, E, I, K, H, G;
        if (typeof J[0] === "string") {
            E = J.shift();
            if (typeof J[0] === "string") {
                D = J.shift()
            } else {
                D = o(E)
            }
            L = {files: [{url: E, filename: D}]}
        } else {
            L = J.shift();
            if (L == null) {
                throw new Error("Missing arguments. See documentation.")
            }
            if (!(((H = L.files) != null ? H.length : void 0) || typeof L.files === "function")) {
                throw new Error("Missing files. See documentation.")
            }
            G = L.files;
            for (I = 0, K = G.length; I < K; I++) {
                F = G[I];
                if (!F.filename) {
                    F.filename = o(F.url)
                }
            }
        }
        return L
    };
    Dropbox.save = function () {
        var G, I, H, F, J, E, D;
        G = 1 <= arguments.length ? u.call(arguments, 0) : [];
        F = h(G);
        if (!Dropbox.isBrowserSupported()) {
            alert(z("Your browser does not support the Dropbox Saver"));
            return
        }
        F._popup = true;
        if (!(typeof F.files === "object" && F.files.length)) {
            throw new Error("Opening the saver failed. The object passed in must have a 'files' property that contains a list of objects.  See documentation.")
        }
        D = F.files;
        for (J = 0, E = D.length; J < E; J++) {
            H = D[J];
            if (typeof H.url !== "string") {
                throw new Error("File urls to download incorrectly configured.  Each file must have a url. See documentation.")
            }
        }
        I = l(352, 237);
        return r(B(F), I, F)
    };
    r = function (F, G, E) {
        var I, H, J, D, K;
        I = function () {
            if (!D.closed) {
                D.close()
            }
            Dropbox.removeListener(window, "message", H);
            clearInterval(K)
        };
        H = function (L) {
            if (L.source === D || L.source === (t != null ? t.contentWindow : void 0)) {
                p(L, I, E)
            }
        };
        J = function () {
            if (D.closed) {
                I();
                if (typeof E.cancel === "function") {
                    E.cancel()
                }
            }
        };
        D = window.open(F, "dropbox", "" + G + ",resizable=yes,location=yes");
        if (!D) {
            throw new Error("Failed to open a popup window. Dropbox.choose and Dropbox.save should only be called from within a user-triggered event handler such as a tap or click event.")
        }
        D.focus();
        K = setInterval(J, 100);
        Dropbox.addListener(window, "message", H);
        return D
    };
    A = function (G) {
        var H, F, I, E, D;
        if (G.success == null) {
            if (typeof console !== "undefined" && console !== null) {
                if (typeof console.warn === "function") {
                    console.warn("You must provide a success callback to the Chooser to see the files that the user selects")
                }
            }
        }
        F = function () {
            if (typeof console !== "undefined" && console !== null) {
                if (typeof console.warn === "function") {
                    console.warn("The provided list of extensions or file types is not valid. See Chooser documentation: " + C)
                }
            }
            if (typeof console !== "undefined" && console !== null) {
                if (typeof console.warn === "function") {
                    console.warn("Available file types are: " + s.join(", "))
                }
            }
            return delete G.extensions
        };
        if (G.extensions != null) {
            if (Object.prototype.toString.call(G.extensions) === "[object Array]") {
                D = G.extensions;
                for (I = 0, E = D.length; I < E; I++) {
                    H = D[I];
                    if (!H.match(/^\.[\.\w$#&+@!()\-'`_~]+$/) && b.call(s, H) < 0) {
                        F()
                    }
                }
            } else {
                F()
            }
        }
        return G
    };
    d = function (K) {
        var F, D, I, H, L, J, G, E;
        if (!Dropbox.isBrowserSupported()) {
            alert(z("Your browser does not support the Dropbox Chooser"));
            return
        }
        E = 660;
        H = 440;
        if (K.iframe) {
            G = n(w(K, true));
            G.style.width = E + "px";
            G.style.height = H + "px";
            J = document.createElement("div");
            J.style.position = "fixed";
            J.style.left = J.style.right = J.style.top = J.style.bottom = "0px";
            J.style.zIndex = "1000";
            F = document.createElement("div");
            F.style.position = "absolute";
            F.style.left = F.style.right = F.style.top = F.style.bottom = "0px";
            F.style.backgroundColor = "rgb(160, 160, 160)";
            F.style.opacity = "0.2";
            F.style.filter = "progid:DXImageTransform.Microsoft.Alpha(Opacity=20)";
            L = document.createElement("div");
            L.style.position = "relative";
            L.style.width = E + "px";
            L.style.margin = "125px auto 0px auto";
            L.style.border = "1px solid #ACACAC";
            L.style.boxShadow = "rgba(0, 0, 0, .2) 0px 4px 16px";
            L.appendChild(G);
            J.appendChild(F);
            J.appendChild(L);
            document.body.appendChild(J);
            I = function (M) {
                if (M.source === G.contentWindow) {
                    p(M, (function () {
                        document.body.removeChild(J);
                        Dropbox.removeListener(window, "message", I)
                    }), K)
                }
            };
            Dropbox.addListener(window, "message", I)
        } else {
            D = l(E, H);
            r(w(K), D, K)
        }
    };
    Dropbox.choose = function (D) {
        if (D == null) {
            D = {}
        }
        D = A(D);
        d(D)
    };
    Dropbox.isBrowserSupported = function () {
        var D;
        D = c();
        Dropbox.isBrowserSupported = function () {
            return D
        };
        return D
    };
    c = function () {
        var G, F, E, D;
        D = [/Windows Phone/, /BB10;/, /CriOS/];
        for (F = 0, E = D.length; F < E; F++) {
            G = D[F];
            if (G.test(navigator.userAgent)) {
                return false
            }
        }
        if (!((typeof JSON !== "undefined" && JSON !== null) && (window.postMessage != null))) {
            return false
        }
        return true
    };
    k = function (D) {
        return D.replace(/\/+$/g, "").split("/").pop()
    };
    o = function (E) {
        var D;
        D = document.createElement("a");
        D.href = E;
        return k(D.pathname)
    };
    e = function (E, F) {
        var D;
        if (F != null) {
            F.innerHTML = ""
        } else {
            F = document.createElement("a");
            F.href = "#"
        }
        F.className += " dropbox-dropin-btn";
        if (Dropbox.isBrowserSupported()) {
            F.className += " dropbox-dropin-default"
        } else {
            F.className += " dropbox-dropin-disabled"
        }
        D = document.createElement("span");
        D.className = "dropin-btn-status";
        F.appendChild(D);
        E = document.createTextNode(E);
        F.appendChild(E);
        return F
    };
    Dropbox.createChooseButton = function (D) {
        var E;
        if (D == null) {
            D = {}
        }
        D = A(D);
        E = e(z("Choose from Dropbox"));
        Dropbox.addListener(E, "click", function (F) {
            F.preventDefault();
            d({success: function (G) {
                    E.className = "dropbox-dropin-btn dropbox-dropin-success";
                    if (typeof D.success === "function") {
                        D.success(G)
                    }
                }, cancel: D.cancel, linkType: D.linkType, multiselect: D.multiselect, extensions: D.extensions, iframe: D.iframe, _trigger: "button"})
        });
        return E
    };
    Dropbox.createSaveButton = function () {
        var E, F, D;
        E = 1 <= arguments.length ? u.call(arguments, 0) : [];
        D = h(E);
        F = E.shift();
        F = e(z("Save to Dropbox"), F);
        Dropbox.addListener(F, "click", function (G) {
            var H;
            G.preventDefault();
            if (!(F.className.indexOf("dropbox-dropin-error") >= 0 || F.className.indexOf("dropbox-dropin-default") >= 0 || F.className.indexOf("dropbox-dropin-disabled") >= 0)) {
                return
            }
            H = (typeof D.files === "function" ? D.files() : void 0) || D.files;
            if (!(H != null ? H.length : void 0)) {
                F.className = "dropbox-dropin-btn dropbox-dropin-error";
                if (typeof D.error === "function") {
                    D.error("Missing files")
                }
                return
            }
            Dropbox.save({files: H, success: function () {
                    F.className = "dropbox-dropin-btn dropbox-dropin-success";
                    if (typeof D.success === "function") {
                        D.success()
                    }
                }, progress: function (I) {
                    F.className = "dropbox-dropin-btn dropbox-dropin-progress";
                    if (typeof D.progress === "function") {
                        D.progress(I)
                    }
                }, cancel: function () {
                    if (typeof D.cancel === "function") {
                        D.cancel()
                    }
                }, error: function (I) {
                    F.className = "dropbox-dropin-btn dropbox-dropin-error";
                    if (typeof D.error === "function") {
                        D.error(I)
                    }
                }})
        });
        return F
    };
    q = function (E, D) {
        return"background: " + E + ";\nbackground: -moz-linear-gradient(top, " + E + " 0%, " + D + " 100%);\nbackground: -webkit-linear-gradient(top, " + E + " 0%, " + D + " 100%);\nbackground: linear-gradient(to bottom, " + E + " 0%, " + D + " 100%);\nfilter: progid:DXImageTransform.Microsoft.gradient(startColorstr='" + E + "', endColorstr='" + D + "',GradientType=0);"
    };
    j = document.createElement("style");
    j.type = "text/css";
    y = '@-webkit-keyframes rotate {\n  from  { -webkit-transform: rotate(0deg); }\n  to   { -webkit-transform: rotate(360deg); }\n}\n\n@keyframes rotate {\n  from  { transform: rotate(0deg); }\n  to   { transform: rotate(360deg); }\n}\n\n.dropbox-dropin-btn, .dropbox-dropin-btn:link, .dropbox-dropin-btn:hover {\n  display: inline-block;\n  height: 14px;\n  font-family: "Lucida Grande", "Segoe UI", "Tahoma", "Helvetica Neue", "Helvetica", sans-serif;\n  font-size: 11px;\n  font-weight: 600;\n  color: #636363;\n  text-decoration: none;\n  padding: 1px 7px 5px 3px;\n  border: 1px solid #ebebeb;\n  border-radius: 2px;\n  border-bottom-color: #d4d4d4;\n  ' + (q("#fcfcfc", "#f5f5f5")) + "\n}\n\n.dropbox-dropin-default:hover, .dropbox-dropin-error:hover {\n  border-color: #dedede;\n  border-bottom-color: #cacaca;\n  " + (q("#fdfdfd", "#f5f5f5")) + "\n}\n\n.dropbox-dropin-default:active, .dropbox-dropin-error:active {\n  border-color: #d1d1d1;\n  box-shadow: inset 0 1px 1px rgba(0,0,0,0.1);\n}\n\n.dropbox-dropin-btn .dropin-btn-status {\n  display: inline-block;\n  width: 15px;\n  height: 14px;\n  vertical-align: bottom;\n  margin: 0 5px 0 2px;\n  background: transparent url('" + Dropbox.baseUrl + "/static/images/widgets/dbx-saver-status.png') no-repeat;\n  position: relative;\n  top: 2px;\n}\n\n.dropbox-dropin-default .dropin-btn-status {\n  background-position: 0px 0px;\n}\n\n.dropbox-dropin-progress .dropin-btn-status {\n  width: 18px;\n  margin: 0 4px 0 0;\n  background: url('" + Dropbox.baseUrl + "/static/images/widgets/dbx-progress.png') no-repeat center center;\n  -webkit-animation-name: rotate;\n  -webkit-animation-duration: 1.7s;\n  -webkit-animation-iteration-count: infinite;\n  -webkit-animation-timing-function: linear;\n  animation-name: rotate;\n  animation-duration: 1.7s;\n  animation-iteration-count: infinite;\n  animation-timing-function: linear;\n}\n\n.dropbox-dropin-success .dropin-btn-status {\n  background-position: -15px 0px;\n}\n\n.dropbox-dropin-disabled {\n  background: #e0e0e0;\n  border: 1px #dadada solid;\n  border-bottom: 1px solid #ccc;\n  box-shadow: none;\n}\n\n.dropbox-dropin-disabled .dropin-btn-status {\n  background-position: -30px 0px;\n}\n\n.dropbox-dropin-error .dropin-btn-status {\n  background-position: -45px 0px;\n}\n\n@media only screen and (-webkit-min-device-pixel-ratio: 1.4) {\n  .dropbox-dropin-btn .dropin-btn-status {\n    background-image: url('" + Dropbox.baseUrl + "/static/images/widgets/dbx-saver-status-2x.png');\n    background-size: 60px 14px;\n    -webkit-background-size: 60px 14px;\n  }\n\n  .dropbox-dropin-progress .dropin-btn-status {\n    background: url('" + Dropbox.baseUrl + "/static/images/widgets/dbx-progress-2x.png') no-repeat center center;\n    background-size: 20px 20px;\n    -webkit-background-size: 20px 20px;\n  }\n}\n\n.dropbox-saver:hover, .dropbox-chooser:hover {\n  text-decoration: none;\n  cursor: pointer;\n}\n\n.dropbox-chooser, .dropbox-dropin-btn {\n  line-height: 11px !important;\n  text-decoration: none !important;\n  box-sizing: content-box !important;\n  -webkit-box-sizing: content-box !important;\n  -moz-box-sizing: content-box !important;\n}\n";
    if (j.styleSheet) {
        j.styleSheet.cssText = y
    } else {
        j.textContent = y
    }
    document.getElementsByTagName("head")[0].appendChild(j);
    setTimeout(f, 0);
    a = function () {
        if (document.removeEventListener) {
            document.removeEventListener("DOMContentLoaded", a, false)
        } else {
            if (document.detachEvent) {
                document.detachEvent("onreadystatechange", a)
            }
        }
        return v()
    };
    if (document.readyState === "complete") {
        setTimeout(a, 0)
    } else {
        if (document.addEventListener) {
            document.addEventListener("DOMContentLoaded", a, false)
        } else {
            document.attachEvent("onreadystatechange", a)
        }
    }
    Dropbox.VERSION = "2";
    v = function () {
        var F, G, E, D;
        D = document.getElementsByTagName("a");
        for (G = 0, E = D.length; G < E; G++) {
            F = D[G];
            if (b.call((F.getAttribute("class") || "").split(" "), "dropbox-saver") >= 0) {
                (function (H) {
                    Dropbox.createSaveButton({files: function () {
                            return[{url: H.getAttribute("data-url") || H.href, filename: H.getAttribute("data-filename") || k(H.pathname)}]
                        }}, H)
                })(F)
            }
        }
    }
}).call(this);
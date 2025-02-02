/*! @name videojs-quality-selector @version 2.0.0 @license MIT */
!(function (t, e) {
    "object" == typeof exports && "undefined" != typeof module
        ? (module.exports = e(require("video.js")))
        : "function" == typeof define && define.amd
        ? define(["video.js"], e)
        : ((t = "undefined" != typeof globalThis ? globalThis : t || self).videojsHlsQualitySelector = e(t.videojs));
})(this, function (t) {
    "use strict";
    function e(t) {
        return t && "object" == typeof t && "default" in t ? t : { default: t };
    }
    var i = e(t);
    const s = i.default.getComponent("MenuButton"),
        l = i.default.getComponent("Menu"),
        n = i.default.getComponent("Component"),
        u = i.default.dom;
    class o extends s {
        constructor(t) {
            super(t, { title: t.localize("Quality"), name: "QualityButton" });
        }
        createItems() {
            return [];
        }
        createMenu() {
            const t = new l(this.player_, { menuButton: this });
            if (((this.hideThreshold_ = 0), this.options_.title)) {
                const i = u.createEl("li", {
                        className: "vjs-menu-title",
                        innerHTML: ((e = this.options_.title), "string" != typeof e ? e : e.charAt(0).toUpperCase() + e.slice(1)),
                        tabIndex: -1,
                    }),
                    s = new n(this.player_, { el: i });
                (this.hideThreshold_ += 1), t.addItem(s);
            }
            var e;
            if (((this.items = this.createItems()), this.items)) for (let e = 0; e < this.items.length; e++) t.addItem(this.items[e]);
            return t;
        }
    }
    const a = i.default.getComponent("MenuItem");
    class r extends a {
        constructor(t, e, i, s) {
            super(t, { label: e.label, selectable: !0, selected: e.selected || !1 }), (this.item = e), (this.qualityButton = i), (this.plugin = s);
        }
        handleClick() {
            for (let t = 0; t < this.qualityButton.items.length; ++t) this.qualityButton.items[t].selected(!1);
            this.plugin.setQuality(this.item.value), this.selected(!0);
        }
    }
    const h = i.default.getPlugin("plugin"),
        d = {};
    class c extends h {
        constructor(t, e) {
            super(t),
                (this.options = i.default.obj.merge(d, e)),
                this.player.ready(() => {
                    this.player.qualityLevels && (this.player.addClass("vjs-hls-quality-selector"), this.createQualityButton(), this.bindPlayerEvents());
                });
        }
        bindPlayerEvents() {
            this.player.qualityLevels().on("addqualitylevel", this.onAddQualityLevel.bind(this));
        }
        createQualityButton() {
            const t = this.player;
            this._qualityButton = new o(t);
            const e = t.controlBar.children().length - 2,
                i = t.controlBar.addChild(this._qualityButton, { componentClass: "qualitySelector" }, this.options.placementIndex || e);
            if ((i.addClass("vjs-quality-selector"), this.options.displayCurrentQuality)) this.setButtonInnerText(t.localize("Auto"));
            else {
                const t = ` ${this.options.vjsIconClass || "vjs-icon-hd"}`;
                i.menuButton_.$(".vjs-icon-placeholder").className += t;
            }
            i.removeClass("vjs-hidden");
        }
        setButtonInnerText(t) {
            this._qualityButton.menuButton_.$(".vjs-icon-placeholder").innerHTML = t;
        }
        getQualityMenuItem(t) {
            const e = this.player;
            return new r(e, t, this._qualityButton, this);
        }
        onAddQualityLevel() {
            const t = this.player.qualityLevels().levels_ || [],
                e = [];
            for (let i = 0; i < t.length; ++i) {
                const { width: s, height: l } = t[i],
                    n = s > l ? l : s;
                if (n && !e.filter((t) => t.item && t.item.value === n).length) {
                    const t = this.getQualityMenuItem.call(this, { label: n + "p", value: n, selected: this.options.defaultQuality === n });
                    this.options.defaultQuality === n && this.setQuality(n), e.push(t);
                }
            }
            e.sort((t, e) => {
                if ("object" != typeof t || "object" != typeof e) return -1;
                if (this.options.largestResolutionFirst) {
                    if (t.item.value > e.item.value) return -1;
                    if (t.item.value < e.item.value) return 1;
                } else {
                    if (t.item.value < e.item.value) return -1;
                    if (t.item.value > e.item.value) return 1;
                }
                return 0;
            }),
                this.options.disableAutoQuality || e.push(this.getQualityMenuItem.call(this, { label: this.player.localize("Auto"), value: "auto", selected: !0 })),
                this._qualityButton && ((this._qualityButton.createItems = () => e), this._qualityButton.update());
        }
        setQuality(t) {
            const e = this.player.qualityLevels();
            (this._currentQuality = t), this.options.displayCurrentQuality && this.setButtonInnerText("auto" === t ? this.player.localize("Auto") : `${t}p`);
            for (let i = 0; i < e.length; ++i) {
                const { width: s, height: l } = e[i],
                    n = s > l ? l : s;
                e[i].enabled = n === t || "auto" === t;
            }
            this._qualityButton.unpressButton();
        }
        getCurrentQuality() {
            return this._currentQuality || "auto";
        }
    }
    return (c.VERSION = "2.0.0"), i.default.registerPlugin("hlsQualitySelector", c), c;
});

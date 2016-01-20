(function ($) {
    'use strict';

    /**
     * Provides methods to load a modal from an ajax resource.
     *
     * @author Thomas Rudolph <me@holloway-web.de>
     * @since 2015.03.24
     * @param el
     * @param options
     * @constructor
     */
    var HwAjaxModal = function (el, options) {
        this.options = $.extend({}, HwAjaxModal.DEFAULTS, options);
        this.$element = $(el);

        this.$element.modal($.extend({}, this.options.bootstrap, {'show': false}));
        this.$element.on('hidden.bs.modal', $.proxy(this.removeChildren, this));
    };

    /**
     * Data key for element data and event namespaces.
     *
     * @type {string}
     */
    HwAjaxModal.DATA_KEY = 'hw.ajaxmodal';

    /**
     * Default options.
     *
     * @type {{bootstrap: {}, loader: string}}
     */
    HwAjaxModal.DEFAULTS = {
        'bootstrap': {},
        'loader': '<div class="ajax-loader"><h5>Please wait...</h5></div>'
    };

    /**
     * Fires the error event if the ajax request failed.
     *
     * @param xhr
     */
    HwAjaxModal.prototype.fireErrorEvent = function (xhr) {
        var event = jQuery.Event('error.' + HwAjaxModal.DATA_KEY);
        event.xhr = xhr;

        this.removeChildren();
        this.removeLoader();
        this.$element.modal('hide');
        this.$element.trigger(event);
    };

    /**
     * Hides the loader.
     */
    HwAjaxModal.prototype.hideLoader = function () {
        this.$element.modal('hide');
    };

    /**
     * Fires a get request.
     *
     * @param url
     * @param data
     * @returns {*}
     */
    HwAjaxModal.prototype.load = function (url, data) {
        this.showLoader();
        $.get(url, data, $.proxy(this.setContent, this))
            .fail($.proxy(this.fireErrorEvent, this));
    };

    /**
     * Remove all children except the bootstrap modal backdrop.
     */
    HwAjaxModal.prototype.removeChildren = function () {
        this.$element.children().each(function () {
            var $this = $(this);
            // cancel if child is bootstraps modal backdrop
            if ($this.hasClass('modal-backdrop')) {
                return;
            }
            // cancel if it's the loader
            if (true === $this.data('loader.' + HwAjaxModal.DATA_KEY)) {
                return;
            }

            $this.fadeOut('fast', function () {
                $(this).remove();
            });
        });
    };

    /**
     * Removes the loader.
     */
    HwAjaxModal.prototype.removeLoader = function () {
        if (this.$loader) {
            this.$loader.fadeOut('fast', function () {$(this).remove();});
        }
    };

    /**
     * Fires a post request.
     *
     * @param url
     * @param data
     * @returns {*}
     */
    HwAjaxModal.prototype.request = function (url, data) {
        this.showLoader();
        $.post(url, data, $.proxy(this.setContent, this))
            .fail($.proxy(this.fireErrorEvent, this));
    };

    /**
     * Sets the content from the request into the modal.
     *
     * If the response data is not a string (probably not html), it hides the modal.
     *
     * Events:
     * In case of html data it fires the event `htmldata.hw.ajaxmodal`.
     * Otherwise it fires `otherdata.hw.ajaxmodal`.
     *
     * @param data
     */
    HwAjaxModal.prototype.setContent = function (data) {
        var event;
        var $data;
        this.removeChildren();
        this.removeLoader();

        if ('string' != typeof data) {
            event = jQuery.Event('otherdata.' + HwAjaxModal.DATA_KEY);
            event.data = data;
            this.$element.trigger(event);
            this.$element.modal('hide');
            return;
        }

        $data = $(data);
        event = jQuery.Event('htmldata.' + HwAjaxModal.DATA_KEY);
        event.element = $data;
        this.$element.append($data);
        this.$element.trigger(event);
        this.$element.modal('show');
    };

    /**
     * Shows the loader.
     *
     * Creates it if it doesn't exist yet.
     * If no loader is configured, nothing will happen.
     */
    HwAjaxModal.prototype.showLoader = function () {
        if (!this.options.loader) {
            return;
        }
        this.removeChildren();

        var loaderLoaded = false;
        this.$element.children().each(function () {
            if (true === $(this).data('loader.' + HwAjaxModal.DATA_KEY)) {
                loaderLoaded = true;
            }
        });

        if (!loaderLoaded) {
            this.$loader = $(this.options.loader);
            this.$loader.data('loader.' + HwAjaxModal.DATA_KEY, true);
            this.$loader.hide();
            this.$element.append(this.$loader);
            this.$loader.fadeIn('fast');
        }

        if (!this.$element.hasClass('in')) {
            this.$element.modal('show');
        }
    };

    /**
     * Instantiates the ajax modal plugin or calls a method from it.
     *
     * @see HwAjaxModal
     * @returns {*}
     */
    $.fn.hwAjaxModal = function () {
        var thisArguments = [];
        for (var c = 0; c < arguments.length; c++) {
            thisArguments.push(arguments[c]);
        }
        return this.each(function () {
            var $this = $(this);
            var data = $this.data(HwAjaxModal.DATA_KEY);
            var options = 'object' == typeof thisArguments[0] && thisArguments[0];

            if (!data) {
                data = new HwAjaxModal(this, options);
                $this.data(HwAjaxModal.DATA_KEY, data);
            }
            if (data && 'string' == typeof thisArguments[0]) {
                var method = thisArguments[0];
                data[method].apply(data, thisArguments.slice(1));
            }
        });
    };
}(jQuery));

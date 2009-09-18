(function($) {
/**
 * This jQuery plugin displays pagination links and load content via Ajax
 * @author Wu Yuntao
 * @version 0.1
 */

$.widget('ui.ajaxPagination', {
    _init: function() {
        var self = this;
        // Create a sane value for maxentries and items_per_page
        if (!(this._getData('maxEntries') >= 0))
            this._setData('maxEntries', 1);
        if (!(this._getData('itemsPerPage') >= 0))
            this._setData('itemsPerPage', 1);
        this.select(this._getData('currentPage'));
    },
    /**
     * Get or initialize a page
     */
    page: function(num, options) {
        // Try to get from cache
        var self = this,
            page = this._getData('_page_' + num);
        // Query from DOM
        if (!page) page = this.element.find('ul.pagination li#page-' + num);
        // Create the paginator
        if (!page || !page.length) {
            var bp = this._getData('basePage'),
                np = this.numPages(),
                num = num < bp ? bp : (num > bp + np ? bp + np : num),
                options = $.extend({ text: num, classes: 'page' }, options || {}),
                page = $('<li></li>').appendTo(this.paginator()),
                link = $('<a></a>').attr('href', this._url(num))
                                   .attr('id', 'page-' + num)
                                   .addClass(options.classes || '')
                                   .text(options.text)
                                   .bind('click.pagination', select)
                                   .appendTo(page);
        }
        if (num == this._getData('currentPage')) {
            page.addClass('current');
        }
        // Save to cache
        this._setData('_page_' + num);
        return page;

        function select(e) {
            self.select(parseInt(this.id.slice(5)));
            if (self._getData('select')) {
                self._getData('select')(e, {
                    paginator: self.paginator(),
                    page: page,
                    content: self.content(num, { load: false })
                });
            }
            return false;
        }
    },
    /**
     * Get or initialize paginator
     */
    paginator: function(options) {
        // Try to get from cache
        var paginator = this._getData('_paginator'),
            options = $.extend({
                refresh: false
            }, options || {});
        // Query from DOM
        if (!paginator) paginator = this.element.children('ul.paginator');
        // Create the paginator
        if (!paginator || !paginator.length) {
            paginator = $('<ul></ul>').addClass('paginator')
                                      .appendTo(this.element);
        }
        // Refresh page links
        if (options.refresh) {
            this._empty();
            this._previous();
            this._leading();
            this._adjacent();
            this._trailing();
            this._next();
        }
        // Save to cache
        this._setData('_paginator', paginator);
        return paginator;
    },
    /**
     * Get or load content via Ajax
     */
    content: function(num, options) {
        // Try to get from cache
        var self = this,
            content = this._getData('_content_' + num),
            options = $.extend({
                load: true
            }, options || {});
        // Query from DOM
        if (!content) content = this.element.children('div#content-' + num);
        // Create the paginator
        if (!content || !content.length) {
            content = $('<div></div>').attr('id', 'content-' + num)
                                      .addClass('content');
            if (this._getData('showAtBottom')) {
                content.prependTo(this.element);
            } else {
                content.appendTo(this.element);
            }
        }
        if (options.load) {
            if (!this._getData('cache') || !content.hasClass('state-cached')) {
                $.ajax({
                    url: this._url(num),
                    type: this._getData('type'),
                    dataType: 'html',
                    success: function(html) {
                        self.element.children('div.content').hide();
                        content.html(html).addClass('state-cached').show();
                    }
                });
            } else {
                self.element.children('div.content').hide();
                content.show();
            }
        }
        // Save to cache
        this._setData('_content_' + num);
        return content;
    },
    /**
     * Select a page and load content via Ajax
     */
    select: function(num) {
        this._setData('currentPage', num);
        this.paginator({ refresh: true });
        this.content(num);
    },
    /** 
     * Select previous page
     */
    previous: function() {
        if (this._getData('currentPage') > this._getData('basePage')) {
            this.select(this._getData('currentPage') - 1);
            return true;
        } else {
            return false;
        }
    },
    /** 
     * Select next page
     */
    next: function() {
        if(this._getData('currentPage') < this.numPages()) {
            this.select(this._getData('currentPage') + 1);
            return true;
        } else {
            return false;
        }
    },
    /**
     * Calculate the maximum number of pages
     */
    numPages: function() {
        return Math.ceil((this._getData('maxEntries') - 
                this._getData('basePage')) / this._getData('itemsPerPage'));
    },
    /**
     * Calculate start and end point of page links depending on 
     * ``basePage``, ``currentPage`` and ``numDisplayEntries``.
     */
    displayPages: function() {
        var display = this._getData('numDisplayEntries'),
            base = this._getData('basePage'),
            total = base + this.numPages();
        if (display > 0) {
            current = this._getData('currentPage'),
            half = Math.ceil(display / 2),
            limit = total - display + 1,
            start = current > half ?
                    Math.max(Math.min(current - half + 1, limit), base) : base,
            end = current > half ?
                    Math.min(start + display - 1, total) : 
                    Math.min(base + display - 1, total);
            return [start, end];
        } else {
            return [total + 1, base - 1];
        }
    },
    /**
     * Apply URL with given page number
     */
    _url: function(num) {
        return this._getData('url').replace('#{id}', num);
    },
    /**
     * Following functions insert page links into the paginator
     */
    _previous: function() {
        if (this._getData('prevText') &&
            this._getData('currentPage') > this._getData('basePage') ||
            this._getData('prevShowAlways')) {
            this.page(this._getData('currentPage') - 1, {
                text: this._getData('prevText'),
                classes: "previous"
            });
        }
    },
    _next: function() {
        if(this._getData('nextText') && this._getData('currentPage') <
           this._getData('basePage') + this.numPages() ||
           this._getData('nextShowAlways')) {
            this.page(this._getData('currentPage') + 1, {
                text: this._getData('nextText'),
                classes: "next"
            });
        }
    },
    _leading: function() {
        var leading = this.displayPages()[0],
            edge = this._getData('numEdgeEntries'),
            base = this._getData('basePage');
        if (leading > base && edge > 0) {
            var end = Math.min(base + edge, leading);
            for(var i = base; i < end; ++i) {
                this.page(i);
            }
            if (base + edge < leading && this._getData('ellipseText')) {
                this._ellipse();
            }
        }
    },
    _adjacent: function() {
        var display = this.displayPages();
        for (var i = display[0]; i <= display[1]; ++i) {
            this.page(i);
        }
    },
    _trailing: function() {
        var trailing = this.displayPages()[1],
            base = this._getData('basePage'),
            edge = this._getData('numEdgeEntries'),
            total = base + this.numPages();
        if (trailing < total && edge > 0) {
            if (total - edge > trailing && this._getData('ellipseText')) {
                this._ellipse();
            }
            var start = Math.max(total - edge + 1, trailing + 1);
            for(var i = start; i <= total; ++i) {
                this.page(i);
            }
        }
    },
    _ellipse: function() {
        return $("<li></li>").text(this._getData('ellipseText'))
                             .appendTo(this.paginator());
    },
    _empty: function() {
        this.paginator().empty();
    }
});

$.extend($.ui.ajaxPagination, {
    defaults: {
        url: '',
        // 'GET' or 'POST'
        type: 'GET',
        // 缓存每页的内容
        cache: false,
        currentPage: 1,
        itemsPerPage: 10,
        maxEntries: 0,
        numDisplayEntries: 4,
        numEdgeEntries: 2,
        linkTo: "#page/#{id}/",
        prevText: "前一页",
        nextText: "后一页",
        ellipseText: "...",
        prevShowAlways: false,
        nextShowAlways: false,
        // 在底部显示分页
        showAtBottom: true,
        // 页数的基数，默认为 1
        basePage: 1,
        // Events
        select: null,
    }
});

})(jQuery);

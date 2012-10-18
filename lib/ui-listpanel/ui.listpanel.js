/*
 * jQuery UI List Panel
 *
 * Authors:
 *  Ben Wann (ben.wann[at]gmail[dot]com)
 *
 * Dual licensed under the MIT (MIT-LICENSE.txt)
 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://www.benwann/listpanel/
 *
 *
 * Depends:
 *	ui.core.js
 *	jquery.scrollpane.js
 */


(function($, undefined) {

    $.widget("ui.listpanel", {
        options: {
            searchable: true,
            animated: 'fast',
            show: 'slideDown',
            hide: 'slideUp',
            new_entity_label: 'new entity',
            publisher: function(){},
            notifyMethod: ''
        },

        _create: function() {
        	this.id = this.element.attr("id");
        },

        _init: function(){
        	this.element.empty();
        	/*
				<div class="list_panel">
	            	<div class="add_flow"><a class="plus_btn" href="#"></a><p>NEW $ENTITY</p></div>

	                <div class="search_box">
						<img class="searchsubmit1" alt="Search"/>
						<input type="text" class="search searchfield" name="search" value="Search">
						<img class="searchsubmit2" alt="Search"/>
						<div class="clear"></div>
					</div>

					<div class="account_list">
                        <ul>
                            <li>
	                            <a href="">Account name</a>
	                            <div class="account_arrow"><a href=""></a></div>
                            </li>
                            <li>
	                            <a href="">Account name</a>
	                            <div class="account_arrow"><a href=""></a></div>
                            </li>
						</ul>
					</div>
				</div>
             */

            this.pane_wrapper = $('<div class="left_side_bar"></div>').appendTo(this.element);

            this.flow_div = $('<div class="add_flow"><span class="plus_btn" href="#"/><span class="add_flow_text">'+ this.options.new_entity_label +'</span></div>').appendTo(this.pane_wrapper);

            var search_html = '';
            search_html += '<div class="new_search_box">';
            search_html += '<input type="text" placeholder="Search" class="new_searchfield search" name="search">';
            search_html += '<span class="icon_wrapper"><span class="search_icon"/></span>';
            //search_html += '<div class="searchsubmit1"/>';
            //search_html += '<div class="searchsubmit2"/>';
            search_html += '<div class="clear"></div>';
            search_html += '</div>';

            this.search_div = $(search_html).appendTo(this.pane_wrapper);

            this.listContainer = $('<div class="list-panel-anchor"></div>').appendTo(this.pane_wrapper);
            this.list = $('<ul></ul>').appendTo(this.listContainer);

            var that = this;

			$('.searchsubmit2').click(function() {
				$('.searchfield, .search').val('');
			});

            // init lists
            this._populateLists(this.options.data);

            //set up click events
            this._registerViewEvents(this.listContainer.find('li'));
            this._registerAddEvents(this.flow_div);

            // set up livesearch
            if (this.options.searchable) {
                this._registerSearchEvents(this.search_div.find('input.search'));
            } else {
                $('.search').hide();
            }

            $(function(){
                var posX = ($('.sidebar').position() || {}).top || 0;
                $('.list-panel-anchor').css({'min-height':(($(window).height())-185-posX)+'px'});
                $('.list-panel-anchor').css({'height':(($(window).height())-185-posX)+'px'});
                var thisSp = $('.list-panel-anchor').jScrollPane({
                    verticalDragMaxHeight: 15
                });

                var api = $(thisSp).data('jsp');
                var throttleTimeout;
                $(window).bind(
                    'resize',
                    function()
                    {
                        if ($.browser.msie) {
                            // IE fires multiple resize events while you are dragging the browser window which
                            // causes it to crash if you try to update the scrollpane on every one. So we need
                            // to throttle it to fire a maximum of once every 50 milliseconds...
                            if (!throttleTimeout) {
                                throttleTimeout = setTimeout(
                                    function()
                                    {
                                        api.reinitialise();
                                        throttleTimeout = null;
                                    },
                                    50
                                );
                            }
                        } else {
                            var posX = ($('.sidebar').position() || {}).top || 0;
                            $('.list-panel-anchor').css({'min-height':(($(window).height())-185-posX)+'px'});
                            $('.list-panel-anchor').css({'height':(($(window).height())-185-posX)+'px'});
                            api.reinitialise();
                        }
                    }
                );
            });
        },

        destroy: function() {
            this.element
				.removeClass( "ui-progressbar ui-widget ui-widget-content ui-corner-all" )
				.removeAttr( "role" )
				.removeAttr( "aria-valuemin" )
				.removeAttr( "aria-valuemax" )
				.removeAttr( "aria-valuenow" );

			this.pane_wrapper.remove();
            $.Widget.prototype.destroy.apply(this, arguments);
        },

        _populateLists: function(data) {
            this.list.children('.list-element').remove();

            var that = this;
            var items = $(data.map(function(i) {
                return that._getListNode(i).appendTo(that.list).show();
            }));
        },

        _getListNode: function(node_data) {

        	var html_string = '';
        	html_string += '<li class="list-element" title="'+node_data.title+'" id="'+node_data.id+'">';
        	html_string += '<a data-action="media" data-module="activate" href="#">'+node_data.title+'</a>';
        	//html_string += '<div class="row_arrow"><a data-action="media" data-module="activate" href="#"></a></div>';
        	html_string += '</li>';

        	var node = $(html_string).hide();
            $.data(node[0], 'data', node_data);
            return node;
        },

        // taken from John Resig's liveUpdate script
        _filter: function(list) {
            var input = $(this);
            var rows = list.children('li'),
            cache = rows.map(function(){

                return $(this).text().toLowerCase();
            });

            var term = $.trim(input.val().toLowerCase()), scores = [];

            if (!term) {
                rows.show();
            } else {
                rows.hide();

                cache.each(function(i) {
                    if (this.indexOf(term)>-1) {
                        scores.push(i);
                    }
                });

                $.each(scores, function() {
                    $(rows[this]).show();
                });
            }
        },

        _registerHoverEvents: function(elements) {
            /*elements.removeClass('ui-state-hover');
            elements.mouseover(function() {
                $(this).addClass('ui-state-hover');
            });
            elements.mouseout(function() {
                $(this).removeClass('ui-state-hover');
            });
            */
        },

        _registerViewEvents: function(elements) {
            var self = this;
        	elements.click(function(){
                //elements.removeClass('selected');
                //$(this).addClass('selected');

                if('notifyParent' in self.options) {
                    self.options.publisher(true, self.options.notifyMethod, $.data(this, 'data'), self.options.notifyParent);
                }
                else {
                    self.options.publisher(true, self.options.notifyMethod, $.data(this, 'data'));
                }

                return false;
            });
        },

        _registerAddEvents: function(elements) {
        	var self = this;
        	elements.click(function(){
                if('notifyParent' in self.options) {
        		    self.options.publisher(true, self.options.notifyCreateMethod, {}, self.options.notifyParent);
                }
                else {
        		    self.options.publisher(true, self.options.notifyCreateMethod, {});
                }

        		return false;
        	});
        },

        _registerSearchEvents: function(input) {
            var that = this;
            /*input.focus(function() {
                $(this).addClass('ui-state-active');
            })
            .blur(function() {
                $(this).removeClass('ui-state-active');
            })*/
            input.keypress(function(e) {
                if (e.keyCode == 13)
                    return false;
            })
            .keyup(function() {
                var api = $('.list-panel-anchor').data('jsp');
                api.scrollToY(0);
                that._filter.apply(this, [that.list]);
            });
        }
    });


})(jQuery);

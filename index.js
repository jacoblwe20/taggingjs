/* More info: https://github.com/sniperwolf/taggingJS */

// taggingJS v1.2.5
//    2014-04-10

// Copyright (c) 2014 Fabrizio Fallico

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
//  all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

// modified to work with system

module.exports = Tagging;
// make jQuery availiable globally
var $;

function Tagging( _$, selector, options ) {

    var _this = this;
    $ = _$;
    noop = function() {};
    // Setting up default options (in alphabetical order)
    this.default_options = {
        "case-sensitive": false, // True to allow differences between lowercase and uppercase
        "close-char": "&times;", // Single Tag close char
        "close-class": "tag-i", // Single Tag close class
        "edit-on-delete": true, // True to edit tag that has just been removed from tag box
        "forbidden-chars": [ ".", "_", "?" ], // Array of forbidden characters
        "forbidden-chars-callback": noop, // Function to call when there is a forbidden chars
        "forbidden-chars-text": "Forbidden character:", // Basic text passed to forbidden-chars callback
        "forbidden-words": [], // Array of forbidden words
        "forbidden-words-callback": noop, // Function to call when there is a forbidden words
        "forbidden-words-text": "Forbidden word:", // Basic text passed to forbidden-words callback
        "no-backspace": false, // Backspace key remove last tag, true to avoid that
        "no-comma": false, // Comma "," key add a new tag, true to avoid that
        "no-del": false, // Delete key remove last tag, true to avoid that
        "no-duplicate": true, // No duplicate in tag box
        "no-duplicate-callback": noop, // Function to call when there is a duplicate tag
        "no-duplicate-text": "Duplicate tag:", // Basic text passed to no-duplicate callback
        "no-enter": false, // Enter key add a new tag, true to avoid that
        "no-spacebar": false, // Spacebar key add a new tag by default, true to avoid that
        "pre-tags-separator": ", ", // By default, you must put new tags using a new line
        "tag-box-class": "tagging", // Class of the tag box
        "tag-char": "#", // Single Tag char
        "tag-class": "tag", // Single Tag class
        "tags-input-name": "tag", // Name to use as name="" in single tags (by default tag[])
        "type-zone-class": "type-zone", // Class of the type-zone
    };

    // Saving for very slight optimization
    this.$el = $( selector );

    // Here we will save all tags (for reference)
    this.tags = [];
    this.settings = $.extend( {}, this.default_options, options );


    // For each 'tag_box' (caught with user's jQuery selector)
    // TODO : Decouple alot of this monster
    this.$el.each( function() {

        var init_text, $actual_tag_box,
            add_keys, all_keys, remove_keys;
        /*KEYS_OBJ, ADD_KEYS_OBJ, REMOVE_KEYS_OBJ,
            l, i, _i, _l, key_obj;*/

        // the actual tagging box
        $actual_tag_box = $( this );

        // Pre-existent text 
        init_text = ( $actual_tag_box.html() + '' ).trim();

        // Empty the original div
        $actual_tag_box.empty();

        // Create the type_zone input using custom class and contenteditable attribute
        _this.$type_zone = $( "<input/>" )
            .addClass( _this.settings[ "type-zone-class" ] )
            .attr( 'placeholder', _this.settings.placeholder || 'Enter a Tag' )
            .attr( "contenteditable", true );

        // Adding tagging class and appending the type zone
        $actual_tag_box
            .addClass( _this.settings[ "tag-box-class" ] )
            .append( _this.$type_zone );

        // Special keys to add a tag
        add_keys = {
            comma: 188,
            enter: 13
        };

        // Special keys to remove last tag
        remove_keys = {
            del: 46,
            backspace: 8,
        };

        // Merging keys
        all_keys = $.extend( {}, add_keys, remove_keys );


        // Keydown event listener on type_zone
        _this.$type_zone.on( "keydown", function( e ) {
            var $last_tag, key, index, i, l,
                forbidden_chars, actual_text, pressed_key,
                callback_f, callback_t;

            // Forbidden Chars shortcut
            forbidden_chars = _this.settings[ "forbidden-chars" ];

            // Actual text in the type_zone
            actual_text = _this.$type_zone.val();

            // The pressed key
            pressed_key = e.which;

            // For in loop to look to Remove Keys
            if ( actual_text === "" ) {

                for ( key in all_keys ) {

                    // Some special key
                    if ( pressed_key === all_keys[ key ] ) {

                        // Enter or comma or spacebar - We cannot add an empty tag
                        if ( add_keys[ key ] !== undefined ) {

                            // Prevent Default
                            e.preventDefault();

                            // Exit with 'true'
                            return true;
                        }

                        // Backspace or Del
                        if ( remove_keys[ key ] !== undefined ) {

                            // Checking if it enabled
                            if ( !_this.settings[ "no-" + key ] ) {

                                // Prevent Default
                                e.preventDefault();

                                // Retrieve last tag
                                $last_tag = _this.tags.pop();

                                // If there is a tag
                                if ( $last_tag !== undefined ) {

                                    // Removing last tag
                                    _this.emit( 'tags.remove', {
                                        value: $last_tag.find( 'input' ).val(),
                                        $target: $last_tag,
                                        $parent: _this.$el
                                    } );
                                    $last_tag.remove();

                                    // If you want to change the text when a tag is deleted
                                    if ( _this.settings[ "edit-on-delete" ] ) {
                                        _this.$type_zone
                                            .focus()
                                            .val( "" )
                                            .val( $last_tag.pure_text );
                                    }
                                }
                            }
                        }

                        // Exit
                        return false;
                    }
                }
            }
            else {

                // For in to look in Add Keys
                for ( key in add_keys ) {

                    // Enter or comma or spacebar if enabled
                    if ( pressed_key === add_keys[ key ] ) {
                        if ( !_this.settings[ "no-" + key ] ) {

                            // Prevent Default
                            e.preventDefault();

                            // Adding tag with no text
                            return _this.add_tag( _this.$type_zone, null, _this.settings );
                        }

                        // Exit
                        return false;
                    }
                }

                // For loop to remove Forbidden Chars from Text
                l = forbidden_chars.length;
                for ( i = 0; i < l; i += 1 ) {

                    // Looking for a forbidden char
                    index = actual_text.indexOf( forbidden_chars[ i ] );

                    // There is a forbidden text
                    if ( index !== -1 ) {

                        // Prevent Default
                        e.preventDefault();

                        // Removing Forbidden Char
                        actual_text = actual_text.replace( forbidden_chars[ i ], "" );

                        // Update type_zone text
                        _this.$type_zone
                            .focus()
                            .val( "" )
                            .val( actual_text );

                        // Renaiming
                        callback_f = _this.settings[ "forbidden-chars-callback" ];
                        callback_t = _this.settings[ "forbidden-chars-text" ];

                        // Remove the duplicate
                        return _this.error( callback_f, callback_t, forbidden_chars[ i ] );
                    }
                }
            }
            _this.emit( 'tags.keypress', {
                value: actual_text,
                $target: _this.$type_zone,
                $parent: _this.$el
            } );
            // Exit with success
            return true;
        } );

        _this.$type_zone.on( "blur", function( e ) {
            // Actual text in the type_zone
            var actual_text = _this.$type_zone.val();

            if ( !actual_text.length ) {
                return;
            }
            
            return _this.add_tag( _this.$type_zone, null, _this.settings );
        } );

        // On click, we focus the type_zone
        $actual_tag_box.on( "click", function() {
            _this.$type_zone.focus();
        } );

        // @link stackoverflow.com/questions/12911236/setting-focus-to-the-end-of-a-textarea
        _this.$type_zone.on( "focus", function() {
            this.selectionStart = this.selectionEnd = $( this ).val().length;
        } );

        // if it looks like html
        if ( /^\</.test( init_text ) ) {

            // split up 
            var $tags = $( init_text );
            $tags.each( function() {
                var txt = this.innerHTML;
                _this.add_tag( _this.$type_zone, txt, _this.settings, true );
            } );
            return;
        }

        // Adding text present on type_zone as tag on first call
        $.each( init_text.split( _this.settings[ 'pre-tags-separator' ] ), function() {
            _this.add_tag( _this.$type_zone, this.toString(), _this.settings, true );
        } );

    } );

}

/**
 * Add a new tag to tag_box
 *
 * @param  $_Obj     _this.$type_zone         jQuery Object with tag type div
 * @param  string    text               Tag's text
 * @param  object    actual_settings    Settings that must be used here
 * @return boolean                      true => OK, tag added | false => Something is wrong
 */
Tagging.prototype.add_tag = function( $type_zone, text, actual_settings, skipEmit ) {
    var i, l, t,
        index,
        forbidden_words,
        callback_f,
        callback_t,
        $tag,
        _this = this;


    // If there are no specific settings, use the ones defined at the top
    actual_settings = actual_settings || this.settings;

    // Forbidden Words shortcut
    forbidden_words = actual_settings[ "forbidden-words" ];

    // If no text is passed, take it as text of _this.$type_zone and then empty it
    if ( !text ) {
        text = this.$type_zone.val();
        this.$type_zone.val( "" );
    }

    // If it is empty too, then stop
    if ( !text || !text.length ) {
        return false;
    }

    text = ( text || '' ).trim();

    // If case-sensitive is true, write everything in lowercase
    if ( actual_settings[ "case-sensitive" ] === false ) {
        text = text.toLowerCase();
    }

    // Checking if text is a Forbidden Word
    l = forbidden_words.length;
    if ( l !== 0 ) {

        // For loop
        for ( i = 0; i < l; i += 1 ) {

            // Looking for a forbidden words
            index = text.indexOf( forbidden_words[ i ] );

            // There is a forbidden word
            if ( index !== -1 ) {

                // Removing all text and ','
                this.$type_zone.val( "" );

                // Renaiming
                callback_f = actual_settings[ "forbidden-words-callback" ];
                callback_t = actual_settings[ "forbidden-words-text" ];

                // Remove as a duplicate
                return this.error( callback_f, callback_t, text );
            }
        }

    }

    // If no-duplicate is true, check that the text is not already present
    if ( actual_settings[ "no-duplicate" ] === true ) {

        // Looking for each text inside tags
        l = this.tags.length;
        if ( l !== 0 ) {

            for ( i = 0; i < l; i += 1 ) {
                t = this.tags[ i ].pure_text;

                if ( t === text ) {
                    // Removing all text and ','
                    this.$type_zone.val( "" );

                    // Renaiming
                    callback_f = actual_settings[ "no-duplicate-callback" ];
                    callback_t = actual_settings[ "no-duplicate-text" ];

                    // Remove the duplicate
                    return this.error( callback_f, callback_t, text );

                }
            }
        }
    }

    // Creating a new div for the new tag
    $tag = $( "<div/>" )
        .addClass( "tag" );

    // don't use .html() to avoid executing any bad script
    $tag[ 0 ].innerHTML = ( this.settings.prefix || '' ) + text;

    // Creating and Appending hidden input
    $( "<input/>" )
        .attr( "type", "hidden" )
    // custom input name
    .attr( "name", actual_settings[ "tags-input-name" ] + "[]" )
        .val( text )
        .appendTo( $tag );

    // Creating and tag button (with "x" to remove tag)
    $( "<span/>" )
        .attr( "role", "button" )
        // adding custom class
        .addClass( actual_settings[ "close-class" ] )
        // using custom char
        .html( actual_settings[ "close-char" ] )
        // click addEventListener
        .click(function() {
            _this.emit('tags.remove', {
                value : $tag.find('input').val(), 
                $target : $tag,
                $parent : _this.$el
            });
            var existingIndex = _this.tags.indexOf( $tag );
            if ( existingIndex > -1 ) {
                _this.tags.splice( existingIndex, 1 );
            }
            $tag.remove();
        })
        // finally append close button to tag element
        .appendTo( $tag );

    // emit tag.added with text and tag element
    if ( !skipEmit ) {
        this.emit( 'tags.add', {
            value: text,
            $target: $tag,
            $parent: this.$el
        } );
    }

    // Adding pure_text property to $tag
    $tag.pure_text = text;

    // Adding to tags the new tag (as jQuery Object)
    this.tags.push( $tag );

    // Adding tag in the type zone
    // don't use .before() to avoid <script> tag execution
    var parent = this.$type_zone.parent()[ 0 ];
    parent.insertBefore( $tag[ 0 ], this.$type_zone[ 0 ] );

    return false;
};

Tagging.prototype.emit = function() {
    var _emitter = this.settings.emitter,
        // ability to namespace events
        namespace = this.settings.namespace;
    if ( typeof arguments[ 0 ] !== 'string' ) return;

    if ( namespace ) {
        arguments[ 0 ] = namespace + '.' + arguments[ 0 ];
    }

    if ( _emitter ) {
        if ( typeof _emitter.emit === 'function' ) {
            return _emitter.emit.apply( _emitter, arguments );
        }

        if ( typeof _emitter.trigger === "function" ) {
            return _emitter.trigger.apply( _emitter, arguments );
        }
    }
};

/**
 * Remove a tag
 *
 * @param  function callback_f    Callback to invoke
 * @param  string   callback_t    Text to use in callback
 * @param  string   tag_text      Duplicate Text
 * @return boolean
 */
Tagging.prototype.error = function( callback_f, callback_t, tag_text ) {
    // Calling the callback with t as th
    callback_f.apply(
        this, [ callback_t + " '" + tag_text + "'." ]
    );
    // We don't add tag
    return false;
};

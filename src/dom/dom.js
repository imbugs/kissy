/**
 * @module  dom-base
 * @author  lifesinger@gmail.com
 */

KISSY.add('dom-base', function(S, undefined) {

    var doc = document,
        docElement = doc.documentElement,
        TEXT = docElement.textContent !== undefined ? 'textContent' : 'innerText',
        ua = S.UA,
        ie = ua.ie,
        oldIE = ie && ie < 8,
        CUSTOM_ATTRS = {
            readonly: 'readOnly'
        },
        RE_SPECIAL_ATTRS = /href|src|style/,
        RE_NORMALIZED_ATTRS = /href|src|colspan|rowspan/,
        RE_RETURN = /\r/g,
        RE_RADIO_CHECK = /radio|checkbox/,
        defaultFrag = doc.createElement('DIV'),
        RE_TAG = /^[a-z]+$/i;

    if(oldIE) {
        S.mix(CUSTOM_ATTRS, {
            'for': 'htmlFor',
            'class': 'className'
        });
    }

    S.DOM = {

        /**
         * Returns a NodeList that matches the selector.
         */
        query: S.query,

        /**
         * Returns the first element that matches the selector.
         */
        get: S.get,

        /**
         * Gets or sets the attribute of the HTMLElement.
         */
        attr: function(el, name, val) {
            // don't set attributes on element nodes
            if (!el || el.nodeType !== 1) {
                return undefined;
            }

            var ret;
            name = name.toLowerCase();
            name = CUSTOM_ATTRS[name] || name;

            // get attribute
            if (val === undefined) {
                // ������ el[name] ��ȡ mapping ����ֵ��
                //  - ������ȷ��ȡ readonly, checked, selected ������ mapping ����ֵ
                //  - ���Ի�ȡ�� getAttribute ��һ���ܻ�ȡ����ֵ������ tabindex Ĭ��ֵ
                //  - href, src ֱ�ӻ�ȡ���� normalized ���ֵ���ų���
                if(!RE_SPECIAL_ATTRS.test(name)) {
                    ret = el[name];
                }
                // get style
                else if(name === 'style') {
                    ret = el.style.cssText;
                }
                
                // �� getAttribute ��ȡ�� mapping ���Ժ� href, src ��ֵ��
                if(ret === undefined) {
                    ret = el.getAttribute(name);
                }

                // fix ie bugs:
                if (oldIE && RE_NORMALIZED_ATTRS.test(name)) {
                    // ������ href, src, ���� rowspan �ȷ� mapping ���ԣ�Ҳ��Ҫ�õ� 2 ����������ȡԭʼֵ
                    ret = el.getAttribute(name, 2);
                }

                // ���ڲ����ڵ����ԣ�ͳһ���� undefined
                return ret === null ? undefined : ret;
            }

            // set attribute
            if(name === 'style') {
                el.style.cssText = val;
            }
            else {
                // convert the value to a string (all browsers do this but IE)
                el.setAttribute(name, '' + val);
            }
        },

        /**
         * Removes the attribute of the HTMLElement.
         */
        removeAttr: function(el, name) {
            if(el && el.nodeType === 1) {
                el.removeAttribute(name);
            }
        },

        /**
         * Get the current value of the HTMLElement.
         */
        val: function(el, value) {
            if(!el || el.nodeType !== 1) {
                return undefined;
            }

            // get value
            if(value === undefined) {

                // ��û���趨 value ʱ����׼����� option.value == option.text
                // ie7- �� optinos.value == '', ��Ҫ�� el.attributes.value ���ж��Ƿ����趨 value
                if(nodeNameIs('option', el)) {
                    return (el.attributes.value || {}).specified ? el.value : el.text;
                }

                // ���� select, �ر��� multiple type, ���ں����صļ���������
                if(nodeNameIs('select', el)) {
                    var index = el.selectedIndex,
                        options = el.options;

                    if (index < 0) {
                        return null;
                    }
                    else if(el.type === 'select-one') {
                        return S.DOM.val(options[index]);
                    }

                    // Loop through all the selected options
                    var ret = [], i = 0, len = options.length;
                    for (; i < len; ++i) {
                        if (options[i].selected) {
                            ret.push(S.DOM.val(options[i]));
                        }
                    }
                    // Multi-Selects return an array
                    return ret;
                }

                // Handle the case where in Webkit "" is returned instead of "on" if a value isn't specified
                if(ua.webkit && RE_RADIO_CHECK.test(el.type)) {
                    return el.getAttribute('value') === null ? 'on' : el.value;
                }

                // ��ͨԪ�ص� value, ��һ���� \r
                return (el.value || '').replace(RE_RETURN, '');
            }

            // set value
            if (nodeNameIs('select', el)) {
                var vals = S.makeArray(value),
                    opts = el.options, opt;

                for (i = 0,len = opts.length; i < len; ++i) {
                    opt = opts[i];
                    opt.selected = S.inArray(S.DOM.val(opt), vals);
                }

                if (!vals.length) {
                    el.selectedIndex = -1;
                }
            }
            else {
                el.value = value;
            }
        },

        /**
         * Gets or sets styles on the HTMLElement.
         */
        css: function(el, prop, val) {
            // get style
            if(val === undefined) {
                return el.style[prop];
            }

            // set style
            S.each(S.makeArray(el), function(elem) {
                elem.style[prop] = val;
            });

            // TODO:
            //  - ���Ǹ��ּ�����������쳣��� opacity, z-index, float
            //  - more test cases
        },

        /**
         * Gets or sets the the text content of the HTMLElement.
         */
        text: function(el, val) {
            // getText
            if (val === undefined) {
                return (el || {})[TEXT] || '';
            }

            // setText
            if (el) {
                el[TEXT] = val;
            }
        },

        /**
         * Gets the HTML contents of the HTMLElement.
         */
        html: function(el, htmlString) {
            // set html
            if(htmlString === undefined) {
                return el.innerHTML;
            }

            // get html
            el.innerHTML = htmlString;

            // TODO:
            //  - ���Ǹ��ּ��ݺ��쳣�����ӷ�����
        },

        /**
         * Gets the children of the HTMLElement.
         */
        children: function(el) {
            if(el.children) { // ֻ�� firefox �ĵͰ汾��֧��
                return S.makeArray(el.children);
            }
            return getSiblings(el.firstChild);
        },

        /**
         * Gets the siblings of the HTMLElment.
         */
        siblings: function(el) {
            return getSiblings(el.parentNode.firstChild, el);
        },

        /**
         * Gets the immediately following sibling of the element.
         */
        next: function(el) {
            return nth(el, 1, 'nextSibling');
        },

        /**
         * Gets the immediately preceding sibling of the element.
         */
        prev: function(el) {
            return nth(el, 1, 'previousSibling');
        },

        /**
         * Gets the parentNode of the elment.
         */
        parent: function(el) {
            var parent = el.parentNode;
            return parent && parent.nodeType !== 11 ? parent : null;
        },

        /**
         * Creates a new HTMLElement using the provided html string.
         */
        create: function(html, ownerDoc) {
            if (typeof html === 'string') {
                html = S.trim(html); // match IE which trims whitespace from innerHTML
            }

            // simple tag
            if(RE_TAG.test(html)) {
                return (ownerDoc || doc).createElement(html);
            }
            
            var ret = null, nodes, frag;

            frag = ownerDoc ? ownerDoc.createElement('DIV') : defaultFrag;
            frag.innerHTML = html;
            nodes = frag.childNodes;

            if(nodes.length === 1) {
                // return single node, breaking parentNode ref from "fragment"
                ret = nodes[0].parentNode.removeChild(nodes[0]);
            }
            else {
                ret = nl2frag(nodes, ownerDoc || doc);
            }

            return ret;
        },

        /**
         * Creates a stylesheet from a text blob of rules.
         * These rules will be wrapped in a STYLE tag and appended to the HEAD of the document.
         * @param {String} cssText The text containing the css rules
         * @param {String} id An id to add to the stylesheet for later removal
         */
        addStyleSheet: function(cssText, id) {
            var head = doc.getElementsByTagName('head')[0],
                el = doc.createElement('style');

            id && (el.id = id);
            head.appendChild(el); // �����ӵ� DOM ���У������� cssText ��� hack ��ʧЧ

            if (el.styleSheet) { // IE
                el.styleSheet.cssText = cssText;
            } else { // W3C
                el.appendChild(doc.createTextNode(cssText));
            }
        }
    };

    // �ж� el �� nodeName �Ƿ�ָ��ֵ
    function nodeNameIs(val, el) {
        return el && el.nodeName.toUpperCase() === val.toUpperCase();
    }

    // ��ȡԪ�� el ������ siblings
    function getSiblings(n/* first */, el) {
        for (var r = [], j = 0; n; n = n.nextSibling) {
            if (n.nodeType === 1 && n !== el) {
                r[j++] = n;
            }
        }
        return r;
    }

    // ��ȡԪ�� el �� dir(ection) �ϵĵ� n ��Ԫ��
    function nth(el, n, dir) {
        n = n || 0;
        for (var i = 0; el; el = el[dir]) {
            if (el.nodeType === 1 && i++ === n) {
                break;
            }
        }
        return el;
    }

    // �� nodeList ת��Ϊ fragment
    function nl2frag(nodes, ownerDoc) {
        var ret = null, i, len;

        if (nodes && (nodes.push || nodes.item) && nodes[0]) {
            ownerDoc = ownerDoc || nodes[0].ownerDocument;
            ret = ownerDoc.createDocumentFragment();

            if (nodes.item) { // convert live list to static array
                nodes = S.makeArray(nodes);
            }

            for (i = 0, len = nodes.length; i < len; ++i) {
                ret.appendChild(nodes[i]);
            }
        }
        // else inline with log for minification
        else {
            S.error('unable to convert ' + nodes + ' to fragment');
        }

        return ret;
    }
});

/**
 * Notes:
 *
 * 2010.03
 *  ~ attr:
 *    - �� jquery/support.js �У�special attrs �ﻹ�� maxlength, cellspacing,
 *      rowspan, colspan, useap, frameboder, �����Է��֣��� Grade-A ���������
 *      ���޼��������⡣
 *    - �� colspan/rowspan ����ֵ��������ʱ��ie7- ���Զ��������� href һ������Ҫ����
 *      �� 2 �������������jQuery δ���ǣ����ڼ����� bug.
 *    - jQuery ������δ��ʽ�趨 tabindex ʱ�����ļ������⣬kissy ����ԣ�̫�������ˣ�
 *    - jquery/attributes.js: Safari mis-reports the default selected
 *      property of an option �� Safari 4 �����޸�
 *
 * TODO:
 *  - create �Ľ�һ�����ƣ����� cache, �� table, form Ԫ�ص�֧�ֵȵ�
 */
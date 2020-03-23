if(localStorage.getItem('RedmineUtil_enabled')==="TRUE")
{
    
    const REDMINE_UTIL_VERSION="0.2.0";
    const REDMINE_TOOL_ROOT_TAG         = "RedmineToolRoot";
    const REDMINE_TOOL_SELECTION_TAG    = "RedmineToolSelection";
    const REDMINE_TOOL_TAGS             = [REDMINE_TOOL_ROOT_TAG, REDMINE_TOOL_SELECTION_TAG]
    const REDMINE_ALLOWED_TAGS          = ["redpre", "pre", "code", "kbd", "notextile"]

    var attrRE                          = /\s([^'"/\s><]+?)[\s/>]|([^\s=]+)=\s?(".*?"|'.*?')/g;
    var tagRE                           = /<[a-zA-Z\-\!\/](?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])*>/g;/*jshint -W030 */

    var tagRE                           = new RegExp('(<'+REDMINE_ALLOWED_TAGS.join('|<') + 
                                                    '|</'+REDMINE_ALLOWED_TAGS.join('|</') +
                                                    '|<'+REDMINE_TOOL_TAGS.join('|<') +
                                                    '|</'+REDMINE_TOOL_TAGS.join('|</') +
                                                    `)(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])*>` 
                                                    , 'g');

    function RedmineUtil_locate(content, index)
    {
        var text_before=content.substring(0, index);
        var lines=text_before.split('\n');
        return `line: ${lines.length}, col: ${lines[lines.length-1].length + 1}`;
    }

    function RedmineUtil_checkTree(element)
    {
        if(element===null || element.type === 'text' || element.children === null)
        {
            return [];
        }
        
        var errors = (element.isClosed || element.isRoot)?[]:[`Tag is not closed <${element.name}> [type: ${element.type}] at ${element.location}`];

        for(var i=0; i < element.children.length; i++)
        {
            errors = [...errors, ...RedmineUtil_checkTree(element.children[i])];
        }
        return errors;
    }

    function RedmineUtil_parseTag(tag)
    {
        var res = {
            type: 'tag',
            isClosed: false,
            name: '',
            attrs: {},
            children: [],
            isRoot: false,
            parent: null,
            indexInParent: -1
        };
        
        var tagMatch = tag.match(/<\/?([^\s]+?)[/\s>]/);
        if(tagMatch)
        {
            res.name = tagMatch[1];
        }

        var reg = new RegExp(attrRE);
        var result = null;
        for (; ;)
        {
            result = reg.exec(tag);

            if (result === null) {
                break;
            }

            if (!result[0].trim()) {
                continue;
            }

            if (result[1])
            {
                var attr = result[1].trim();
                var arr = [attr, ''];

                if(attr.indexOf('=') > -1) {
                    arr = attr.split('=');
                }

                res.attrs[arr[0]] = arr[1];
                reg.lastIndex--;
            }
            else if (result[2]) {
                res.attrs[result[2]] = result[3].trim().substring(1,result[3].length - 1);
            }
        }

        return res;
    };

    function RedmineUtil_parse(content)
    {
        var result = {
            name: null,
            isRoot: true,
            parent: null,
            children:[]
        };
        var errors = [];
        var current;
        var level = -1;
        var arr = [];
        var byTag = {};
        var first_index=true;

        content.replace(tagRE, function (tag, p1, index) {
            if(first_index)
            {
                if(index !== 0)
                {
                    result.children.push({
                        name: null,
                        type: 'text',
                        indexInParent: 0,
                        content: content.substring(0, index),
                        location: RedmineUtil_locate(content, index)
                    });
                }
                first_index = false;
            }

            var isOpen = tag.charAt(1) !== '/';
            var start = index + tag.length;
            var nextChar = content.charAt(start);
            var parent;

            if (isOpen) 
            {
                level++;

                current = RedmineUtil_parseTag(tag);
                current.location=RedmineUtil_locate(content, index);
                if(current.type === 'tag') 
                {   
                    if (REDMINE_TOOL_TAGS.indexOf(current.name) !== -1) 
                    {
                        current.type = 'redminetool';
                    }
                    else if (REDMINE_ALLOWED_TAGS.indexOf(current.name) !== -1) 
                    {
                        current.type = 'redmine';
                    } else 
                    {
                        current.type = null;
                    }
                }

                if (nextChar && nextChar !== '<') {
                    current.children.push({
                        type: 'text',
                        indexInParent:current.children.length,
                        content: content.slice(start, content.indexOf('<', start)),
                        location: RedmineUtil_locate(content, index)
                    });
                }

                byTag[current.tagName] = current;

                // if we're at root, push new base node
                if (level === 0) {
                    current.parent=result;
                    current.indexInParent=result.children.length;
                    result.children.push(current);
                }

                parent = arr[level - 1];

                if (parent) {
                    current.parent=parent;
                    current.indexInParent=parent.children.length;
                    parent.children.push(current);
                }

                arr[level] = current;
            }
            else
            {
                var c_tag = "</"+ arr[level].name + ">";

                if (c_tag !== tag)
                {
                    errors.push(`Unvalid tag, expected ${c_tag} found ${tag} at ${arr[level].location}`);
                }
                else
                {
                    arr[level].isClosed = true;
                }

                level--;
                
                if (nextChar !== '<' && nextChar) 
                {
                    // trailing text node
                    // if we're at the root, push a base text node. otherwise add as
                    // a child to the current node.
                    parent = level === -1 ? result.children : arr[level].children;

                    // calculate correct end of the content slice in case there's
                    // no tag after the text node.
                    var end = content.indexOf('<', start);
                    var current_content = content.slice(start, end === -1 ? undefined : end);
                    // if a node is nothing but whitespace, no need to add it.
                    if (!/^\s*$/.test(current_content)) {
                        parent.push({
                            type: 'text',
                            indexInParent: parent.length,
                            content: current_content,
                            location: RedmineUtil_locate(content, index)
                        });
                    }
                }
            }
        });
        result.errors=[...errors, ...RedmineUtil_checkTree(result)];
        return result;
    };

    function RedmineUtil_searchTree(element, matching_pattern)
    {
        if(element===null)
        {
            return null;
        }
        if(element.name === matching_pattern)
        {
            return element;
        }
        else if (element.children != null)
        {
            
            var i;
            var result = null;
            for(i=0; result == null && i < element.children.length; i++)
            {
                result = RedmineUtil_searchTree(element.children[i], matching_pattern);
                
                if(result)
                {
                    return result;
                }
            }
        }
        return null;
    }
    function RedmineUtil_havePreviousTagInParent(element)
    {
        return (element.parent !== null  ) &&
            (element.indexInParent>1 || (element.indexInParent===1  && element.parent.children[0].type !== 'text') );
    }
    function RedmineUtil_attrsToStr(attrs)
    {
        var result="";
        for (const property in attrs) 
        {
            result+=` ${property}="${attrs[property]}"`;
        }
        return result;
    }

    //****************************** CHECK SYNTAX ******************************//
    function RedmineUtil_checkSyntax()
    {
        var active_element=document.activeElement;
        if(active_element.tagName=="TEXTAREA")
        {
            var result=RedmineUtil_parse(active_element.value);
            var errors_msg="";
            for(var i=0;i<result.errors.length;i++)
            {
                errors_msg+="\n"+result.errors[i];
            }
            alert(errors_msg.length===0?"Syntax is valid":"Errors:"+errors_msg);
        }
    }

    //******************************** COLORIZE ********************************//
    function RedmineUtil_colorizeSelection(color, bgcolor)
    {
        var active_textarea=document.activeElement;
        if(active_textarea.tagName !== "TEXTAREA" || active_textarea.selectionStart ==active_textarea.selectionEnd)
        {
            return;
        }
        
        var root = RedmineUtil_parse( active_textarea.value.substr(0, active_textarea.selectionStart)+ `<${REDMINE_TOOL_SELECTION_TAG}>` + 
                            active_textarea.value.substr(active_textarea.selectionStart, active_textarea.selectionEnd - active_textarea.selectionStart) + 
                            `</${REDMINE_TOOL_SELECTION_TAG}>` + active_textarea.value.substr(active_textarea.selectionEnd));
        var selection = RedmineUtil_searchTree(root , REDMINE_TOOL_SELECTION_TAG);
        
        var parent_tag_name = selection.parent.name;
        var parent_attrs    = selection.parent!==null?selection.parent.attrs:null;
        var new_value = null;

        switch(parent_tag_name)
        {
            case null: //ROOT
            new_value =  
                    "%{background:"+bgcolor+";color:"+color+"}<notextile>" + 
                        active_textarea.value.substr(active_textarea.selectionStart,active_textarea.selectionEnd - active_textarea.selectionStart) + 
                    "</notextile>% "; 
                    break;
            case "code":
            new_value = 
                "</"+parent_tag_name+">%{background:"+bgcolor+";color:"+color+"}<notextile>" + 
                    active_textarea.value.substr(active_textarea.selectionStart,active_textarea.selectionEnd - active_textarea.selectionStart) + 
                "</notextile>% <"+parent_tag_name + RedmineUtil_attrsToStr(parent_attrs) +"> ";
            break;
            case "pre":
            new_value = 
                (RedmineUtil_havePreviousTagInParent(selection)?"":"<notextile></notextile>") + 
                "%{background:"+bgcolor+";color:"+color+"}<notextile>" + 
                    active_textarea.value.substr(active_textarea.selectionStart,active_textarea.selectionEnd - active_textarea.selectionStart) + 
                "</notextile>% ";
            break;
        }
        if(new_value)
        {
            document.execCommand("insertText", false, new_value);
        }
        active_textarea.focus();
    }
    function RedmineUtil_rgb2hex(rgb) 
    {
        if (  rgb.search("rgb") == -1 ) 
        {
            return rgb;
        } 
        else 
        {
            rgb = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+))?\)$/);
            function hex(x) 
            {
                return ("0" + parseInt(x).toString(16)).slice(-2);
            }
            return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]); 
        }
    }

    function RedmineUtil_colorizeSelectionBtnClick(event)
    {
        RedmineUtil_colorizeSelection(RedmineUtil_rgb2hex(event.target.style.color),RedmineUtil_rgb2hex(event.target.style.backgroundColor));
    }

    function RedmineUtil_toggleSideBar()
    {
        var sidebar=document.getElementById('sidebar');
        var content=document.getElementById('content');

        if(sidebar===null || content ===null)
        {
            return;
        }

        if(sidebar.hasAttribute('hidden'))
        {
            sidebar.removeAttribute('hidden');
            content.style.width='75%';
        }
        else
        {
            sidebar.setAttribute('hidden','');
            content.style.width='auto';
        }
    }

    function RedmineUtil_checkUpdate()
    {
        var last_update_check = localStorage.getItem('RedmineUtil_lastUpdateCheck');
        var new_version       = localStorage.getItem('RedmineUtil_lastUpdateCheckVersion') || REDMINE_UTIL_VERSION;
        var diffDays          = 1;
        
        if(last_update_check!==null)
        {
            diffDays = Math.floor((new Date() - new Date(last_update_check)) / (1000 * 60 * 60 * 24)); 
        }

        if(diffDays !== 0 && navigator.connection.rtt != 0) 
        {
            var xmlHttp = new XMLHttpRequest();
            xmlHttp.open( "GET", "https://raw.githubusercontent.com/abdalmoez/redmine-util-chrome-extension/master/version"); 
            xmlHttp.onreadystatechange= (e)=> { 
                if(xmlHttp.readyState == 4 && xmlHttp.status == 200) 
                {		
                    new_version = xmlHttp.responseText.trim();
                    localStorage.setItem('RedmineUtil_lastUpdateCheck', new Date());
                    localStorage.setItem('RedmineUtil_lastUpdateCheckVersion', new_version);
                    if(new_version>REDMINE_UTIL_VERSION)
                    {
                        document.getElementById('RedmineUpdate').removeAttribute('hidden');
                        document.getElementById('RedmineUpdateNewVersion').innerText = new_version;
                    }
                }
            }
            xmlHttp.send( null );
        } 
        else 
        {
            if(new_version>REDMINE_UTIL_VERSION)
            {
                document.getElementById('RedmineUpdate').removeAttribute('hidden');
                document.getElementById('RedmineUpdateNewVersion').innerText = new_version;
            }
        }
    }
    function RedmineUtil_isValidName(bookmark, new_name)
    {
        return (new_name.length >= 3) && ( bookmark.findIndex(cell => cell.name === new_name) === -1 );
    }
    function RedmineUtil_createContextMenu(parent) 
    {
        var context_menu = document.getElementById("RedmineUtilBookmarkContextMenu");
        var context_menu_items = context_menu.getElementsByTagName('li');

        parent.addEventListener('contextmenu', function(event) {
            var target = event.target.parentNode.parentNode;
            // Avoid the real one
            event.preventDefault();
            
            // Show contextmenu
            context_menu.style.display  = "inline-block";

            context_menu.style.top      = (event.pageY - target.offsetTop  - self.frames.scrollY)+ "px";
            context_menu.style.left     = (event.pageX - target.offsetLeft - self.frames.scrollX)+ "px";
            context_menu.setAttribute("target-bookmark", event.target.getAttribute("bookmark-index"));
        });
        context_menu.addEventListener('mouseleave', function(event) {
            // If the clicked element is not the menu
                context_menu.style.display="none";
        });

        if(context_menu.getAttribute("target-bookmark")===null)
        {    
            for(var i = 0; i < context_menu_items.length; i++)
            {
                context_menu_items[i].addEventListener('click', function(event) {
                    var target_bookmark = context_menu.getAttribute("target-bookmark");
                    var bookmark = JSON.parse(localStorage.getItem('RedmineUtil_Bookmark') || "[]") ;

                    switch(event.target.getAttribute("data-action")) {
                        
                        case "remove": 
                        {
                            if(confirm(`Are you sure to remove this color '${bookmark[target_bookmark].name}' from bookmark!\n`))
                            {
                                bookmark.splice(target_bookmark, 1);
                                localStorage.setItem('RedmineUtil_Bookmark', JSON.stringify(bookmark));
                                RedmineUtil_drawBookmark();
                            }
                            break;
                        }
                        case "rename": 
                        {
                            var name;
                            do {
                                name = prompt("Enter a new name:\n  Minimal length: 3\n  Old name: "+bookmark[target_bookmark].name);
                                if(name === null)
                                {
                                    break;
                                }
                            } while(!RedmineUtil_isValidName(bookmark, name));

                            if(name!==null)
                            {
                                bookmark[target_bookmark].name = name;
                                localStorage.setItem('RedmineUtil_Bookmark', JSON.stringify(bookmark));
                                RedmineUtil_drawBookmark();
                            }
                            break; 
                        }
                    }
                    event.stopPropagation();
                    event.preventDefault();
                    context_menu.style.display="none";
                });
            }
        }
        context_menu.setAttribute("target-bookmark", -1);
    }
    function RedmineUtil_drawBookmark() 
    {

        var bookmark = JSON.parse(localStorage.getItem('RedmineUtil_Bookmark') || "[]") ;
        var bookmark_content = document.getElementById('RedmineUtilBookmarkContent');

        if(bookmark.length===0)
        {
            bookmark_content.parentNode.style.display="none";
        }
        else
        {
            bookmark_content.parentNode.style.display="inline-block";;
            var bookmark_html = "";
            for(var i=0;i<bookmark.length;i++)
            {
                bookmark_html+=`<a bookmark-index="${i}" style="background-color: #${bookmark[i].backgroundColor};color:#${bookmark[i].color};cursor: pointer;" class="RedminePredefinedColor">${bookmark[i].name}</a>`;
            }
            bookmark_content.innerHTML = bookmark_html;

            for(var i=0;i<bookmark_content.children.length;i++)
            {
                RedmineUtil_createContextMenu(bookmark_content.children[i]);
            }              
        }
    }
    function RedmineUtil_drawToolBar() 
    {        
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open( "GET", chrome.extension.getURL('toolbar.html')); 
        xmlHttp.onreadystatechange= (e)=> { 
            if(xmlHttp.readyState == 4 && xmlHttp.status == 200) 
            {		
                var iframe = document.createElement('div');
                iframe.innerHTML=xmlHttp.responseText.trim();
                iframe.id="REDMINE_UTIL_TOOLBAR_ROOT";
                iframe.style.height="auto";
                iframe.style.width="100%";
                iframe.style.position = "fixed";
                iframe.style.top = "0";
                iframe.style.left = "0";
                //iframe.style.background = "#fafafb";
                iframe.style.color = "white";
                iframe.style.border = "0";
                iframe.style.padding = "0";
                iframe.style.margin = "0";
                document.children[0].append(iframe);
                document.body.style.webkitTransform="translateY(35px)"

                document.getElementById('RedmineContentSwitch').addEventListener('click', RedmineUtil_toggleSideBar);

                document.getElementById('RedmineCheckTextile').addEventListener('mousedown', RedmineUtil_checkSyntax);

                var predefined_color_btns = document.getElementsByClassName('RedminePredefinedColor');
                for(var i = 0; i < predefined_color_btns.length; i++)
                {
                    predefined_color_btns[i].addEventListener('mousedown', function(event) {
                        RedmineUtil_colorizeSelection(RedmineUtil_rgb2hex(event.target.style.color),RedmineUtil_rgb2hex(event.target.style.backgroundColor));
                    });
                }

                document.getElementById('RedmineBookmarkCustomColor').addEventListener('click', function() {
                    var bookmark = JSON.parse(localStorage.getItem('RedmineUtil_Bookmark') || "[]") ;                
                    var name;
                    do {
                        name = prompt("Enter a bookmark unique name:\n  Minimal length: 3");
                        if(name === null)
                        {
                            break;
                        }
                    } while(!RedmineUtil_isValidName(bookmark, name));

                    if(name!==null)
                    {
                        var color = document.getElementById('RedmineCustomColorInput').value;
                        var backgroundColor = document.getElementById('RedmineCustomBgColorInput').value;
                        bookmark.push({name,color,backgroundColor});
                        localStorage.setItem('RedmineUtil_Bookmark', JSON.stringify(bookmark));
                        RedmineUtil_drawBookmark();
                    }
                });

                document.getElementById('RedmineCustomColorInput').addEventListener('change', function() {
                    localStorage.setItem('RedmineUtil_customColor', document.getElementById('RedmineCustomColorInput').value);
                    document.getElementById('RedmineCustomColor').style.color = '#' + document.getElementById('RedmineCustomColorInput').value;
                });
            
                document.getElementById('RedmineCustomBgColorInput').addEventListener('change', function() {
                    localStorage.setItem('RedmineUtil_customBgColor', document.getElementById('RedmineCustomBgColorInput').value);
                    document.getElementById('RedmineCustomColor').style.backgroundColor = '#' + document.getElementById('RedmineCustomBgColorInput').value;
                });
                
                var customcolor = localStorage.getItem('RedmineUtil_customColor');
                var custombgcolor  = localStorage.getItem('RedmineUtil_customBgColor');
            
                if(custombgcolor!=undefined)
                {
                    new jscolor(document.getElementById('RedmineCustomBgColorInput'), {value : custombgcolor});
                    document.getElementById('RedmineCustomColor').style.backgroundColor = '#' + custombgcolor;	
                }
            
                if(customcolor!=undefined)
                {
                    new jscolor(document.getElementById('RedmineCustomColorInput'), {value : customcolor});
                    document.getElementById('RedmineCustomColor').style.color = '#' + customcolor;	
                }

                
                RedmineUtil_drawBookmark();
                RedmineUtil_checkUpdate();
            }
        }
        xmlHttp.send( null );
    }

    RedmineUtil_drawToolBar();
}
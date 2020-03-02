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

function RedmineUtil_parseTag(tag) {
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

function RedmineUtil_parse(content) {
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

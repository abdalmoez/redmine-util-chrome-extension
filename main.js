var version="0.1.1";
document.addEventListener('DOMContentLoaded', function() {
  uncompressedColorize=function(){
	 ///Uncompressed Function to be called in current tab
	 ///This function must be compressed and be returned as string in colorize function
	 ///Don't Forget to set color and bgcolorfrom parameters in colorize function
	 
	 var color = "red";
	 var bgcolor = "black";
	 var ae=document.activeElement;
	if(ae.tagName=="TEXTAREA" && ae.selectionStart!=ae.selectionEnd)
	{
		
		const findtag= (before_text)=> {
			var index_pre = Math.max(before_text.lastIndexOf("<pre>"), before_text.lastIndexOf("<pre "));
			var index_code = Math.max(before_text.lastIndexOf("<code>"), before_text.lastIndexOf("<code "));
			if(index_pre == -1 && index_code == -1)
				return {
					tag_params:"",
					content_before_selection: before_text,
					tag_name : "root"
				};
			else if(index_pre<index_code) {
				tag_content = before_text.substring(index_code+5);
				if(tag_content.search(">") == -1) {
					alert("Syntax error: <code>");
					return;
				}
				return {
					tag_params : tag_content.substring(0,tag_content.search(">")-1),
					content_before_selection: tag_content.substring(tag_content.search(">")+1),
					tag_name : "code"
				};
			} else	{
				tag_content = before_text.substring(index_pre+4);
				if(tag_content.search(">") == -1) {
					alert("Syntax error: <pre>");
					return;
				}
				return {
					tag_params : tag_content.substring(0,tag_content.search(">")-1),
					content_before_selection: tag_content.substring(tag_content.search(">")+1),
					tag_name : "pre"
				};
			}
		}
		context = findtag(ae.value.substr(0, ae.selectionStart));
		{
			switch(context.tag_name)
			{
			   case "root": 
				ae.value =  ae.value.substr(0, ae.selectionStart)+ 
						"%{background:"+bgcolor+";color:"+color+"}<notextile>" + 
							ae.value.substr(ae.selectionStart,ae.selectionEnd - ae.selectionStart) + 
						 "</notextile>% " + 
						 ae.value.substr(ae.selectionEnd);
						 break;
			   case "code":
				ae.value = ae.value.substr(0, ae.selectionStart)+ 
					"</"+context.tag_name+">%{background:"+bgcolor+";color:"+color+"}<notextile>" + 
						ae.value.substr(ae.selectionStart,ae.selectionEnd - ae.selectionStart) + 
					 "</notextile>% <"+context.tag_name+" "+context.tag_params +"> "+
					 ae.value.substr(ae.selectionEnd);
				 break;
			   case "pre":
				var state= (context.content_before_selection.search("</notextile>") != -1 || context.content_before_selection.search("</code>") != -1 );
				ae.value = 
					ae.value.substr(0, ae.selectionStart)+ 
					(state?"":"<notextile></notextile>") + 
					"%{background:"+bgcolor+";color:"+color+"}<notextile>" + 
						ae.value.substr(ae.selectionStart,ae.selectionEnd - ae.selectionStart) + 
					 "</notextile>% "+
					 ae.value.substr(ae.selectionEnd);
				 break;
			}
		}
	}
  }
  
  
  
  colorize=function (color,bgcolor){
    return 'var color="'+color+'",bgcolor="'+bgcolor+'", ae=document.activeElement;if("TEXTAREA"==ae.tagName&&ae.selectionStart!=ae.selectionEnd){switch(context=(e=>{var t=Math.max(e.lastIndexOf("<pre>"),e.lastIndexOf("<pre ")),a=Math.max(e.lastIndexOf("<code>"),e.lastIndexOf("<code "));return-1==t&&-1==a?{tag_params:"",content_before_selection:e,tag_name:"root"}:t<a?(tag_content=e.substring(a+5),-1==tag_content.search(">")?void alert("Syntax error"):{tag_params:tag_content.substring(0,tag_content.search(">")-1),content_before_selection:tag_content.substring(tag_content.search(">")+1),tag_name:"code"}):(tag_content=e.substring(t+4),-1==tag_content.search(">")?void alert("Syntax error"):{tag_params:tag_content.substring(0,tag_content.search(">")-1),content_before_selection:tag_content.substring(tag_content.search(">")+1),tag_name:"pre"})})(ae.value.substr(0,ae.selectionStart)),context.tag_name){case"root":ae.value=ae.value.substr(0,ae.selectionStart)+"%{background:"+bgcolor+";color:"+color+"}<notextile>"+ae.value.substr(ae.selectionStart,ae.selectionEnd-ae.selectionStart)+"</notextile>% "+ae.value.substr(ae.selectionEnd);break;case"code":ae.value=ae.value.substr(0,ae.selectionStart)+"</"+context.tag_name+">%{background:"+bgcolor+";color:"+color+"}<notextile>"+ae.value.substr(ae.selectionStart,ae.selectionEnd-ae.selectionStart)+"</notextile>% <"+context.tag_name+" "+context.tag_params+"> "+ae.value.substr(ae.selectionEnd);break;case"pre":var state=-1!=context.content_before_selection.search("</notextile>")||-1!=context.content_before_selection.search("</code>");ae.value=ae.value.substr(0,ae.selectionStart)+(state?"":"<notextile></notextile>")+"%{background:"+bgcolor+";color:"+color+"}<notextile>"+ae.value.substr(ae.selectionStart,ae.selectionEnd-ae.selectionStart)+"</notextile>% "+ae.value.substr(ae.selectionEnd)}}';
  }

  document.getElementById('RedmineContentSwitch').addEventListener('click', function() {
      chrome.tabs.executeScript({
          code: "if(document.getElementById('sidebar').hasAttribute('hidden')){document.getElementById('sidebar').removeAttribute('hidden');document.getElementById('content').style.width='75%';}else{document.getElementById('content').style.width='100%';document.getElementById('sidebar').setAttribute('hidden','');}"
      });
  });
  document.getElementById('RedmineTextareaSuccess').addEventListener('click', function() {
    chrome.tabs.executeScript({code: colorize('#155724','#d4edda')})
  });
  document.getElementById('RedmineTextareaWarning').addEventListener('click', function() {
    chrome.tabs.executeScript({code: colorize('#856404','#fff3cd')})
  });
  document.getElementById('RedmineTextareaError').addEventListener('click', function() {
    chrome.tabs.executeScript({code: colorize('#721c24','#f8d7da')})
  });
  document.getElementById('RedmineTextareaDark').addEventListener('click', function() {
    chrome.tabs.executeScript({code: colorize('#1b1e21','#d6d8d9')})
  });
  document.getElementById('RedmineTextareaLight').addEventListener('click', function() {
    chrome.tabs.executeScript({code: colorize('#818182','#fefefe')})
  });
  document.getElementById('RedmineTextareaInfo').addEventListener('click', function() {
    chrome.tabs.executeScript({code: colorize('#0c5460','#d1ecf1')})
  });
  document.getElementById('RedmineTextareaSecondary').addEventListener('click', function() {
    chrome.tabs.executeScript({code: colorize('#383d41','#e2e3e5')})
  });
  document.getElementById('RedmineTextareaPrimary').addEventListener('click', function() {
    chrome.tabs.executeScript({code: colorize('#004085','#cce5ff')})
  });
  document.getElementById('RedmineCustomColor').addEventListener('click', function() {
    chrome.tabs.executeScript({code: colorize(document.getElementById('RedmineCustomColorInput').value,document.getElementById('RedmineCustomBgColorInput').value)})
  });
  document.getElementById('RedmineCustomColorInput').addEventListener('change', function() {
    localStorage.setItem('customcolor', document.getElementById('RedmineCustomColorInput').value);
    document.getElementById('RedmineCustomColor').style.color = document.getElementById('RedmineCustomColorInput').value;
  });
  document.getElementById('RedmineCustomBgColorInput').addEventListener('change', function() {
    localStorage.setItem('custombgcolor', document.getElementById('RedmineCustomBgColorInput').value);
    document.getElementById('RedmineCustomColor').style.backgroundColor = document.getElementById('RedmineCustomBgColorInput').value;
  });
  var customcolor = localStorage.getItem('customcolor');
  var custombgcolor  = localStorage.getItem('custombgcolor');
  
  if(custombgcolor!=undefined)
  {
	document.getElementById('RedmineCustomBgColorInput').value = custombgcolor;
	document.getElementById('RedmineCustomColor').style.backgroundColor = custombgcolor;	
  }
  
  if(customcolor!=undefined)
  {
	document.getElementById('RedmineCustomColorInput').value = customcolor;
	document.getElementById('RedmineCustomColor').style.color = customcolor;	
  }
  document.getElementById('RedmineUpdate').addEventListener('click', function() {
    chrome.tabs.create({ url: "https://github.com/abdalmoez/redmine-util-chrome-extension" });
  });
  var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", "https://raw.githubusercontent.com/abdalmoez/redmine-util-chrome-extension/master/version"); 
    xmlHttp.onreadystatechange= (e)=>{ 
	if(xmlHttp.readyState == 4 && xmlHttp.status == 200) 
	{
		var new_version = xmlHttp.responseText.trim();
		if(new_version>version)
		{
			document.getElementById('RedmineUpdate').removeAttribute('hidden');
			document.getElementById('RedmineUpdateNewVersion').innerText = new_version;
		}
	}
    }
    xmlHttp.send( null );
});

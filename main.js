document.addEventListener('DOMContentLoaded', function() {
  colorize=function (color,bgcolor){
    return 'if(document.activeElement.tagName=="TEXTAREA"){var ae=document.activeElement;if(ae.selectionStart!=ae.selectionEnd) {ae.value=ae.value.substr(0, ae.selectionStart)+ "</code>%{background:'+bgcolor+';color:'+color+'}<notextile>" + ae.value.substr(ae.selectionStart,ae.selectionEnd-ae.selectionStart) + \'</notextile>%<code class="php"> \'+ ae.value.substr(ae.selectionEnd);}}';
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
	  console.log("change");
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
});

var version="0.1.3";
document.addEventListener('DOMContentLoaded', function() {

	document.getElementById('RedmineContentSwitch').addEventListener('click', function() {
		chrome.tabs.executeScript({ code: `RedmineUtil_toggleSideBar()`});
	});
	
	function rgb2hex(rgb) 
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
	
    var predefined_color_btns = document.getElementsByClassName('RedminePredefinedColor');
    for(var i = 0; i < predefined_color_btns.length; i++)
    {
		predefined_color_btns[i].addEventListener('click', function(event) {
			chrome.tabs.executeScript({code:`RedmineUtil_colorizeSelection('${rgb2hex(event.target.style.color)}','${rgb2hex(event.target.style.backgroundColor)}')`});
		});
	}
	
	document.getElementById('RedmineCheckTextile').addEventListener('click', function() {
		chrome.tabs.executeScript({code:`RedmineUtil_checkSyntax()`});
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
 
    //Update check
    var last_update_check = localStorage.getItem('lastupdatecheck');
  
    var new_version = localStorage.getItem('lastupdatecheckversion') || version;
    var diffDays = 1;
    
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
   				localStorage.setItem('lastupdatecheck', new Date());
   				localStorage.setItem('lastupdatecheckversion', new_version);
 				if(new_version>version)
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
 		if(new_version>version)
 		{
 			document.getElementById('RedmineUpdate').removeAttribute('hidden');
 			document.getElementById('RedmineUpdateNewVersion').innerText = new_version;
 		}
    }
});
 
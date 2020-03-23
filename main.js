document.addEventListener('DOMContentLoaded', function() {
	function RedmineUtil_displayRefreshSection() {
		document.getElementById('RedmineUtilRefreshContent').style.display = 'inline-block';
	}

	var toggle_css   = `.slider:before {content: url('${chrome.extension.getURL('power-off-solid.svg')}');}`;
	var toggle_style = document.createElement('style');

	if (toggle_style.styleSheet) {
		toggle_style.styleSheet.cssText = toggle_css;
	} else {
		toggle_style.appendChild(document.createTextNode(toggle_css));
	}
	document.getElementsByTagName('head')[0].appendChild(toggle_style);

	chrome.tabs.executeScript({ code: `window.location.origin`}, (i)=> {
		if(i) {
			document.getElementById('RedmineUtilTargetURL').innerText=i[0];
		}
	});

	chrome.tabs.executeScript({ code: `localStorage.getItem('RedmineUtil_enabled')`}, (i)=> {
		if(i===null)
		{
			return;
		}
		if(i[0]==="TRUE")
		{	
			document.getElementById('RedmineUtilSwitchInput').setAttribute('checked','');
		}
		else
		{	
			document.getElementById('RedmineUtilSwitchInput').removeAttribute('checked');
		}
	});

	document.getElementById('RedmineUtilGotoRepo').addEventListener('click', function(event) {
		chrome.tabs.create({ url: "https://github.com/abdalmoez/redmine-util-chrome-extension" });
	});

	document.getElementById('RedmineUtilSwitchInput').addEventListener('click', function(event) {
		if(event.target.checked)
		{
			chrome.tabs.executeScript({ code: `localStorage.setItem('RedmineUtil_enabled','TRUE');`});
		}
		else
		{
			chrome.tabs.executeScript({ code: `localStorage.removeItem('RedmineUtil_enabled');`});		
		}
		RedmineUtil_displayRefreshSection();
	});
	document.getElementById('RedmineUtilRefreshBtn').addEventListener('click', function(event) {
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			chrome.tabs.update(tabs[0].id, {url: tabs[0].url});
			window.close();
		});
	});
});
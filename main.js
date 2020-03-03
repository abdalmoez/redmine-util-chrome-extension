document.addEventListener('DOMContentLoaded', function() {

	document.getElementById('RedmineUtilEnable').addEventListener('click', function() {
		chrome.tabs.executeScript({ code: `localStorage.setItem('RedmineUtil_enabled','TRUE');alert('Redmine Util is now enabled!\\nRefresh the page to get it work!');`});		
	});
	document.getElementById('RedmineUtilDisable').addEventListener('click', function() {
		chrome.tabs.executeScript({ code: `localStorage.removeItem('RedmineUtil_enabled');alert('Redmine Util is now disabled!\\nRefresh the page to get it work!');`});		
	});
});
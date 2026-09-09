const words_limit = 500;
function countWords( text ) {
return String(
text || '' ).trim().split( /\s+/ ).filter( Boolean ).length;
}

// ---------------------------- category icon
function getCategoryIcon(
cat) {
const icons = {
'Merch': '📱',
'Fan-art': '🎨',
'Discussion': '💬',
'Review': '⭐'};
return ( icons[cat] || '📝' ); 
}

// ---------------------------- exports
module.exports = { words_limit, countWords, getCategoryIcon};
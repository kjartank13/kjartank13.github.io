var TEXT_PADDING = 100;
var MIN_TEXT_HEIGHT = 400;

function setTextAreaHeight() {
	$('.section.static.text').each(function() {
		var newHeight = 0;
		for (let c of $(this).children()) {
			newHeight += $(c).height();
		}
		newHeight += TEXT_PADDING;
		$(this).height(newHeight < MIN_TEXT_HEIGHT ? MIN_TEXT_HEIGHT : newHeight);
		$(this).css('padding-top', (TEXT_PADDING));
	});
}


function setParallaxHeight() {
	let canaryHeight = $('#canary').height();
	$('.section.parallax').each(function() {
		$(this).height(canaryHeight + 20);
		if ($(this).hasClass('bg3') || $(this).hasClass('bg4'))
			$(this).height(canaryHeight + 40);
	});
	
}

$(function() {
	setTextAreaHeight();
	setParallaxHeight();
	$(window).on('resize', () => {
		setTextAreaHeight();
		setParallaxHeight();
	});
});
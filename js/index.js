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
		if ($(this).hasClass('bg3')) {
			$(this).height($('#topImg').height() + $('#sideImg1').height());
		}
	});
	
}

function sideImgPadding() {
	let sideImgWidth = $('#sideImg1').width();
	let windowWidth = $('#sideImgs').width();
	let diff = windowWidth - sideImgWidth - sideImgWidth;
	$('#sideImgs img').each(function() {
		$(this).css('padding-left', Math.floor(diff / 3) + 'px');
	});
}

$(function() {
	sideImgPadding();
	setTextAreaHeight();
	setParallaxHeight();
	$('#canary').hide();
	$('#sideImgs').height($('#topImg').height());
	$(window).on('resize', () => {

	$('#sideImgs').height($('#topImg').height());
		sideImgPadding();
		setTextAreaHeight();
		setParallaxHeight();
	});
});
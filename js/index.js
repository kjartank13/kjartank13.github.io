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
			console.log($('#topImg').height() + $('#sideImg1').height());
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

function videoPadding() {
	let iframeWidth = $('iframe').width();
	let windowWidth = $('.video').width();
	let diff = windowWidth - iframeWidth;
	$('iframe').css('padding-left', Math.floor(diff / 2));
	$('.video').height($('iframe').height());
}

$(function() {
	setTimeout(() => {
		sideImgPadding();
		videoPadding();
		setTextAreaHeight();
		setParallaxHeight();
		$('#canary').hide();
		$('#sideImgs').height($('#topImg').height());
	}, 100);

	$(window).on('resize', () => {
		$('#sideImgs').height($('#topImg').height());
		sideImgPadding();
		videoPadding();
		setTextAreaHeight();
		setParallaxHeight();
	});
});
/* 轮播背景图片 */
$(function () {
	$.backstretch([
		"/images/background/1.png",
		"/images/background/2.jpg",
		"/images/background/3.jpg",
		"/images/background/4.jpg",
		"/images/background/5.jpg",
		"/images/background/6.jpg",
		"/images/background/7.jpg",
	], { duration: 60000, fade: 1500 });
});

/* 拉姆蕾姆回到顶部或底部按钮 */
$(function() {
	$("#lamu img").eq(0).click(function() {
		$("html,body").animate({scrollTop:$(document).height()},800);
		return false;
	});
	$("#leimu img").eq(0).click(function() {
		$("html,body").animate({scrollTop:0},800);
		return false;
	});
});

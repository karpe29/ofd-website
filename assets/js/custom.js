var winWidth,
    winHeight;


function set_background() {
    $('.set-bg').each(function () {
        if (typeof $(this).attr('data-mob-img') === 'undefined') {
            $(this).css({
                'background': 'url(' + $(this).attr('data-img') + ')',
                'background-size': 'cover'
            });
        } else {
            if (winWidth > 767) {
                if (typeof $(this).attr('data-img') != 'undefined') {
                    $(this).css({
                        'background': 'url(' + $(this).attr('data-img') + ')',
                        'background-size': 'cover'
                    });
                }
            } else {
                $(this).css({
                    'background': 'url(' + $(this).attr('data-mob-img') + ')',
                    'background-size': 'cover'
                });
            }
        }
    });
}

function skroll() {
    var s = skrollr.init({ forceHeight: false });
    if (s.isMobile()) {
        s.destroy();
    }
}

function get_height_width() {
    winWidth = $(window).width(),
        winHeight = $(window).height();
}

function set_height_width() {
    if ($('body').height() < winHeight) {
        $('.wh').outerHeight(winHeight);
    }
    $('.wh-min').css('min-height', winHeight);
    $('.ww').outerWidth(winWidth);
}

function stickyMenu() {
    $(window).scroll(function () {
        if ($(this).scrollTop() > 60) {
            $('.bs-header').addClass("sticky");
        } else {
            $('.bs-header').removeClass("sticky");
        }
    });
}

function social_swiper() {
    var swiper = new Swiper('.social-swiper', {
        slidesPerView: 5,
        spaceBetween: 10,
        loop: true,
        autoplay: false,
        // {
        //     delay:3000,
        // },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        breakpoints: {
            767: {
                slidesPerView: 1,
            },
            992: {
                slidesPerView: 3,
            },
            1024: {
                slidesPerView: 5,
            },
        }
    });
}


function bnnr_swiper() {
    var swiper = new Swiper('.bnnr-swiper', {
        slidesPerView: 1,
        spaceBetween: 0,
        loop: true,
        autoplay: {
            delay: 3000,
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        pagination: {
            el: '.swiper-pagination',
        },
    });
}


function artists_swiper() {
    var swiper = new Swiper('.artists-swiper', {
        slidesPerView: 7,
        spaceBetween: 30,
        // loop:true,
        // autoplay:{
        //     delay:3000,
        // },
        // navigation: {
        //   nextEl: '.swiper-button-next',
        //   prevEl: '.swiper-button-prev',
        // },
        breakpoints: {
            767: {
                slidesPerView: 3,
            },
            992: {
                slidesPerView: 5,
            },
            1024: {
                slidesPerView: 5,
            },
        }
    });

}


function masonary() {
    // // init Masonry
    var $grid = $('.grid').masonry({
        // options...
        itemSelector: '.grid-item',
        isFitWidth: true,
        columnWidth: 3,
        // percentPosition: true
    });
    // layout Masonry after each image loads
    $grid.imagesLoaded().progress(function () {
        $grid.masonry('layout');
    });
    $grid.on('click', '.grid-item-content', function (event) {
        $(event.currentTarget).parent('.grid-item').toggleClass('is-expanded');
        $grid.masonry();
    });
}

// function instafeed() {
// 	// console.log("instafeed");
// 	if ($("#instafeed").length != 0) {
// 		var tutorialFeed = new Instafeed({
// 			get: "user",
// 			userId: "21267191886",
// 			clientId: "225483555931030",
// 			target: "instafeed",
// 			accessToken: "IGQVJWWGNna0h3Y0JLTTBxRlRfb0swRU9TSElZAWVBHNlN3bTBhbzhOQ3ZAfaHVlQkgtcDlHR0VpYlBBVjlDTHA3VmYzS0xxdE9VNkVWSlZABdWdWbFMtdTB4ODZAZAcUpOT0xyM3ZAKTFo1SnNnUjlGZAGFROQZDZD",
// 			resolution: "standard_resolution",
// 			sortBy: "most-recent",
// 			filter: function (image) {
// 				return image.type === "image";
// 			},
// 			limit: 8,                   

//             // template: ' <div class="swiper-container  social-swiper"> <div class="swiper-wrapper"><div class="swiper-slide"><img src="{{image}}"></div></div><div class="swiper-button-next"></div><div class="swiper-button-prev"></div></div>'
// 			template: '<div class="image-item swiper-slide"> <div class=""><img src="{{image}}"></div></div>',     
// 		});
// 		tutorialFeed.run();
// 	}
// }

function menu() {
    $(".navbar-toggler").click(function () {
        $(".navbar-nav").slideToggle();
        $(".bar").toggleClass("change");
    });
}

function sticky_txt() {
    if ($('body').is('.home')) {
        // onscroll text change
        $(".sectiontxt").css("display", "none");

        $(window).on("scroll resize", function () {

            var pos = $(".sectiontxt").offset();
            // console.log($(window).scrollTop());
            console.log();
            if ($(window).scrollTop() >= $('#sec-01').offset().top) {
                $("#sticky-txt-1").show();
            }
            if ($(window).scrollTop() >= $('#sec-02').offset().top) {
                $("#sticky-txt-2").show();
            }
            if ($(window).scrollTop() >= $('#sec-03').offset().top) {
                $("#sticky-txt-3").show();
            }
            var sc = $(window).scrollTop() + 140;
            if (sc >= 40) {
                $(".sectiontxt").css("display", "none");
                $("#fix-p").css("display", "block");
            }
            if (sc >= $("#hidediv").offset().top) {
                $(".sectiontxt").css("display", "none");
                $("#fix-p").css("display", "none");
            } else {
                $(".clr-sec").each(function () {

                    if (pos.top + 300 >= $(this).offset().top && $(this).data("content") === "tara ~ hemanth" && $(".sectiontxt").hasClass("container-out") == false) {
                        // if ($(".sectiontxt").hasClass("container-out")==false) 
                        // {
                        console.log($(".sectiontxt").hasClass("container-out"));
                        $(".sectiontxt").html($(this).data("content"));
                        $(".sectiontxt").css("display", "block");
                        $("#fix-p").css("display", "block");
                        // }

                    } else {
                        if (pos.top >= $(this).offset().top && $(".sectiontxt").hasClass("container-out") == false) {
                            // if ($(".sectiontxt").hasClass("container-out")==false)
                            // {

                            console.log($(".sectiontxt").hasClass("container-out"));
                            $(".sectiontxt").html($(this).data("content"));
                            $(".sectiontxt").css("display", "block");
                            $("#fix-p").css("display", "block");
                            // }				
                        }
                    }
                    $('.three-pics').hover(function () {
                        $(".sectiontxt").css("display", "block");

                        $(".sectiontxt").removeClass("container-out");
                    }, function () {
                        $(".sectiontxt").css("display", "none");
                        $(".sectiontxt").addClass("container-out");
                    });
                });
            }
        });
    }
}

function magnific_div() {
    $(".img-popup").magnificPopup({
        type: "image",
        mainClass: "mfp-with-zoom",
        gallery: {
            enabled: true,
        },
        zoom: {
            enabled: true,
            duration: 300, // duration of the effect, in milliseconds
            easing: "ease-in-out", // CSS transition easing function
            opener: function (openerElement) {
                return openerElement.is("img") ? openerElement : openerElement.find("img");
            },
        },
    });
}

function appendAutoplay(src, extraParams) {
    var separator = src.indexOf('?') !== -1 ? '&' : '?';
    return src + separator + extraParams;
}

function video_popup() {
    $('#myModal').on('shown.bs.modal', function (e) {
        var src = $(e.relatedTarget).data('src');
        if (!src) {
            return;
        }
        if (src.indexOf('vimeo.com') !== -1) {
            src = appendAutoplay(src, 'autoplay=1');
        } else {
            src = appendAutoplay(src, 'autoplay=1&modestbranding=1&showinfo=0');
        }
        $(this).find('iframe').attr('src', src);
    });

    $('#myModal').on('hide.bs.modal', function () {
        $(this).find('iframe').attr('src', '');
    });
}

function video_slider() {
    var swiper = new Swiper('.video-container', {
        slidesPerView: 5,
        spaceBetween: 10,
        loop: true,
        autoplay: {
            delay: 3000
        },
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        breakpoints: {
            767: {
                slidesPerView: 1,
            },
            992: {
                slidesPerView: 2,
            },
            1024: {
                slidesPerView: 3,
            },
            1599: {
                slidesPerView: 3,
            },
        }
    });
}

function magnific_video() {
    $('.popup-gallery').magnificPopup({
        delegate: 'a',
        type: 'image',
        callbacks: {
            elementParse: function (item) {
                // Function will fire for each target element
                // "item.el" is a target DOM element (if present)
                // "item.src" is a source that you may modify
                console.log(item.el.context.className);
                if (item.el.context.className == 'video') {
                    item.type = 'iframe',
                        item.iframe = {
                            patterns: {
                                youtube: {
                                    index: 'youtube.com/', // String that detects type of video (in this case YouTube). Simply via url.indexOf(index).

                                    id: 'v=', // String that splits URL in a two parts, second part should be %id%
                                    // Or null - full URL will be returned
                                    // Or a function that should return %id%, for example:
                                    // id: function(url) { return 'parsed id'; } 

                                    src: '//www.youtube.com/embed/%id%?autoplay=1' // URL that will be set as a source for iframe. 
                                },
                                vimeo: {
                                    index: 'vimeo.com/',
                                    id: '/',
                                    src: '//player.vimeo.com/video/%id%?autoplay=1'
                                },
                                gmaps: {
                                    index: '//maps.google.',
                                    src: '%id%&output=embed'
                                }
                            }
                        }
                } else {
                    item.type = 'image',
                        item.tLoading = 'Loading image #%curr%...',
                        item.mainClass = 'mfp-img-mobile',
                        item.image = {
                            tError: '<a href="%url%">The image #%curr%</a> could not be loaded.'
                        }
                }

            }
        },
        gallery: {
            enabled: true,
            navigateByImgClick: true,
            preload: [0, 1] // Will preload 0 - before current, and 1 after the current image
        }

    });
}

// function sticky_txt_2(){
//     if(sc>$('#sec-01').offset().top){
//         $('.sticky-txt-1').show();
//     }
//     if(sc>$('#sec-02').offset().top){
//         $('.sticky-txt-2').show();
//     }
//     if(sc>$('#sec-03').offset().top){
//         $('.sticky-txt-3').show();
//     }
// }

function validation() {


    $("#contact-form").validate({
        rules: {
            email: {
                required: true,
                email: true
            },
            name: {
                required: true,
            },
            phone: {
                required: true,
                number: true,
                minlength: 10,
                maxlength: 13
            },
            enquiry: {
                required: true
            }
        },

        errorPlacement: function (error, element) {
            error.insertAfter(element.parent());
        },
        submitHandler: function (form) {
            // $(".submit-btn").css("display", "none");
            $(".loader").css("display", "block");
            $(".contact_error").html("Please wait your message is sending..").css("display", "block");
            var data = new FormData(form);
            $.ajax({
                type: "POST",
                //async: false,
                cache: false,
                contentType: false,
                processData: false,
                data: data,
                dataType: "json",
                url: "mail.php",
                success: function (result) {
                    // console.log(result);
                    // alert(result.status)
                    // alert(typeof result.status)
                    if (result.status == 200) {

                        //document.getElementById("sendMailForm").reset();
                        // alert('a')
                        window.location.href = "../../thank-you.php"
                        // var $alertDiv = $(".mailResponse");
                        // $alertDiv.show();
                        // $alertDiv.find('.alert').removeClass('alert-danger alert-success');
                        // $alertDiv.find('.mailResponseText').text("");
                        // if (data.error) {
                        //     $alertDiv.find('.alert').addClass('alert-danger');
                        //     $alertDiv.find('.mailResponseText').text(data.message);
                        // } else {
                        //     $alertDiv.find('.alert').addClass('alert-success');
                        //     $alertDiv.find('.mailResponseText').text(data.message);
                        //     form.reset();
                        // }
                    }
                    else {
                        // alert('b')
                        alert('Failed to send mail,try again later')
                    }
                },
            });
            return false;
        },
    });
}

function control_hide(){
    var iframe = $('.video-54')[0];
    var player = new Vimeo.Player(iframe);

    // Add a click event listener to the custom button
    $(".video-btn").click(function(event) {
      event.preventDefault();

      // Play the Vimeo video when the button is clicked
      player.play();
    });
}


$(function () {
    // control_hide()
    get_height_width();
    set_height_width();
    set_background();
    stickyMenu();
    sticky_txt();
    // instafeed();
    artists_swiper();
    bnnr_swiper();
    skroll();
    // instafeed() ;
    masonary();
    menu();
    magnific_div();
    video_popup();
    video_slider();
    // mansory_lazy_load()
    // $('.lazy').Lazy();
    magnific_video();
    // sticky_txt_2();
    // sendmail();
    validation();
    // videobx();
});

function mansory_lazy_load() {
    var $container = $('.grid');
    $container.imagesLoaded(function () {
        $container.masonry({
            itemSelector: '.grid-item',
            isFitWidth: false,
            columnWidth: 1,
        });
        $('.grid-item img').addClass('not-loaded');
        $('.grid-item img.not-loaded').Lazy({
            effect: 'fadeIn',
            placeholder: "data:image/gif;base64,R0lGODlhEALAPQAPzl5uLr9Nrl8e7...",

            afterLoad: function () {
                // Disable trigger on this image
                $(this).removeClass("not-loaded");
                // $container.masonry('reload');
                $container.masonry();
            }
        });
        $container.on('click', '.grid-item-content', function (event) {
            $(event.currentTarget).parent('.grid-item').toggleClass('is-expanded');
            $grid.masonry();
        });
        $('.grid-item img.not-loaded').trigger('scroll');
    });
}
$(window).load(function () {
    social_swiper();
});


// $(function() {
//     $('.lazy').Lazy();
// });
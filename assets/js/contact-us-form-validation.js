
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
                url: "mail.php",
                success: function (result) {
                    // console.log(result);
                    if (result) {
                        document.getElementById("sendMailForm").reset();
                        var $alertDiv = $(".mailResponse");
                        $alertDiv.show();
                        $alertDiv.find('.alert').removeClass('alert-danger alert-success');
                        $alertDiv.find('.mailResponseText').text("");
                        if (data.error) {
                            $alertDiv.find('.alert').addClass('alert-danger');
                            $alertDiv.find('.mailResponseText').text(data.message);
                        } else {
                            $alertDiv.find('.alert').addClass('alert-success');
                            $alertDiv.find('.mailResponseText').text(data.message);
                            form.reset();
                        }
                    }
                },
            });
            return false;
        },
    });


    // var data = {
    //     'name': $('#name').val(),
    //     'email': $('#email').val(),
    //     'phone': $('#phone').val(),
    //     'enquiry' : $('#enquiry').val()
    // };

    // $.ajax({ 
    //     url: 'mail.php', 
    //     data: data,
    //     type: 'POST',
    //     success: function (data) {
    // 		// For Notification
    //         document.getElementById("sendMailForm").reset();
    //         var $alertDiv = $(".mailResponse");
    //         $alertDiv.show();
    //         $alertDiv.find('.alert').removeClass('alert-danger alert-success');
    //         $alertDiv.find('.mailResponseText').text("");
    //         if(data.error){
    //             $alertDiv.find('.alert').addClass('alert-danger');
    //             $alertDiv.find('.mailResponseText').text(data.message);
    //         }else{
    //             $alertDiv.find('.alert').addClass('alert-success');
    //             $alertDiv.find('.mailResponseText').text(data.message);
    //         }
    //     }
    // });
}

$(function () {
   // alert('b')
    validation();
})
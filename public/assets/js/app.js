/**
 * Created by nikolaialeksandrenko on 2/11/14.
 */
$(document).ready(function() {

    $('#login-btn').click(function() {
       $('#login-panel').toggle();
    });

    $('#lostpassword-btn').click(function() {
        $('#lostpassword-panel').toggle();
    });

    $('#register-btn').click(function() {
        $('#register-panel').toggle();
    });
});
//  account_ng  is the app name,   account_ctrl is the controller name


var account_ng = angular.module('account_ng', ['ui.validate']);

account_ng.directive('convertToNumber', function() {
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, ngModel) {
      ngModel.$parsers.push(function(val) {
        return parseInt(val, 10);
      });
      ngModel.$formatters.push(function(val) {
        return '' + val;
      });
    }
  };
});

account_ng.controller('account_ctrl', function ($scope){
  $scope.user = JSON.parse($("meta[name=user]").attr("content"));
  $scope.password_hash = "";
  $scope.confirm_password_hash="";
  $scope.old_password="";
  $scope.email_result_returned=false;
  // console.log($scope.user);
});


$(document).ready(function onReady(){
  console.log("check");
  $('form[name=reset_password_form]').submit(function (event){
    var target_scope = angular.element( $('#angular_forms') ).scope();
    event.preventDefault();

    $.post($(this).attr("action"),
      {email: target_scope.user.email}, 
      function onSuccess(data, text_status, jqXHR){
        if (data === "email sent"){
          target_scope.$apply( function updateScope(){
            target_scope.email_result_returned = true;

          }); 
          window.setTimeout(function delayed(){
            target_scope.$apply(function (){
              target_scope.email_result_returned  = false;
            })
          },4000);
          $(".email-sent-result").addClass("success");
          $(".email-sent-result").html("Email successfully sent");
        }
      }
    );
  });
});
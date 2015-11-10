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
  console.log($scope.user);
});

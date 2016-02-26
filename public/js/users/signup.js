var app = angular.module('signupForm', []);
app.controller('signupCtrl', ['$scope', function($scope) {
  $scope.submit = function(user) {
    var prefix = (location.hostname.search("fasids.tamu.edu") >= 0 )? "/node/fasids" :"";

    $.get( prefix + "/api/lookupuser?targetuser="+encodeURIComponent(user.email)  , function( data ) {
      if (data.api_result.search("no such user")>=0){
        $("#signup-form").submit();
      } else {
        return alert("the email address has been used for registration");
      }
    });
  };
}]);

// app.directive('username', function($q, $timeout) {
//   return {
//     require: 'ngModel',
//     link: function(scope, elm, attrs, ctrl) {
//       var usernames = ['Jim', 'John', 'Jill', 'Jackie'];

//       ctrl.$asyncValidators.username = function(modelValue, viewValue) {

//         if (ctrl.$isEmpty(modelValue)) {
//           // consider empty model valid
//           return $q.when();
//         }

//         var def = $q.defer();

//         $timeout(function() {
//           // Mock a delayed response
//           // alert("hehe");
//           if (usernames.indexOf(modelValue) === -1) {
//             // The username is available
//             def.resolve();
//           } else {
//             def.reject();
//           }

//         }, 2000);

//         return def.promise;
//       };
//     }
//   };
// });
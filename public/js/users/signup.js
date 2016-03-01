var app = angular.module('signupForm', []);
app.controller('signupCtrl', ['$scope', function($scope) {
  $scope.submit = function(user) {
    var prefix = (location.hostname.search("fasids.tamu.edu") >= 0 )? "/node/fasids" :"";

    $.get( prefix + "/api/lookupuser?targetuser="+encodeURIComponent(user.email)  , function( data ) {
      if (data.api_result.search("no such user")>=0){
        $("form[name=signupform]").submit();
      } else {
        return alert("the email address has been used for registration");
      }
    });
  };
}]);

app.directive('nxEqualEx', function() {
    return {
        require: 'ngModel',
        link: function (scope, elem, attrs, model) {
            if (!attrs.nxEqualEx) {
                console.error('nxEqualEx expects a model as an argument!');
                return;
            }
            scope.$watch(attrs.nxEqualEx, function (value) {
                // Only compare values if the second ctrl has a value.
                if (model.$viewValue !== undefined && model.$viewValue !== '') {
                    model.$setValidity('nxEqualEx', value === model.$viewValue);
                }
            });
            model.$parsers.push(function (value) {
                // Mute the nxEqual error if the second ctrl is empty.
                if (value === undefined || value === '') {
                    model.$setValidity('nxEqualEx', true);
                    return value;
                }
                var isValid = value === scope.$eval(attrs.nxEqualEx);
                model.$setValidity('nxEqualEx', isValid);
                return isValid ? value : undefined;
            });
        }
    };
});
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
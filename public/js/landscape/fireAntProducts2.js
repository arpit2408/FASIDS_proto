var model = {};
angular.module("sortFireAntProduct", ["ngResource"])
.constant("baseUrl", (window.location.href.search("fasids.tamu.edu") >= 0 ?  "/node/fasids" : "" ) + "/api/fire_ant_products/")
//- .directive("ifHas", function ($parse) {
//-   return function (scope, element, attrs) {
//-     var beingWactchedArrayGetter = $parse(attrs['watchArray']);
//-     var targetEntry = attrs['ifHas'];
//-     if (beingWactchedArrayGetter(scope).indexOf(targetEntry)) {

//-     }
//-   }
//- })
.controller("FAPrdtSortCtrl", function($scope, $http, $resource, baseUrl) {
  console.log("FAPrdtSortCtrl()");
  $scope.page_status = JSON.parse(document.getElementById("inpage-script").getAttribute("data-page-status"));
  $scope.displayMode = $scope.page_status.displayMode;
  $scope.sortType = 'product_name'; // set the default sort type
  $scope.sortReverse = false; // set the default sort order
  $scope.FireAntProduct = {};
  $scope.currentProduct = emptyProduct();
  $scope.productsResource = $resource(baseUrl + ":productId", {productId:"@_id"});
  $scope.toBeAddedPestType = "";
  $scope.listProducts = function () {
    console.log("loading");
    $scope.products = $scope.productsResource.query();
    console.log($scope.products);
    //- $scope.currentProduct = $scope.products[0];
    // $scope.displayMode = "edit";
  };

  $scope.deleteProduct = function (product) {

    product.$delete().then( 
      function successCB (response) {
        $scope.products.splice($scope.products.indexOf(product), 1);
        $scope.displayMode = "list";
      },
      function errorCB (response) {

      }
    );
  };

  var createProduct = function (product) {
    console.log("create product");
    new $scope.productsResource(product).$save().then(function (newProduct){
      $scope.products.push(newProduct);
      $scope.displayMode = "list";
    })
  };

  var updateProduct = function (product) {
    console.log("update product");
    product.$save(function (savedProduct, postResponseHeader){
      $scope.displayMode = "list";
    });  // put callback into save
  }

  function emptyProduct() {
    return {
      type_of_uses:[],
      pest_types: []
    }
  }

  $scope.editOrCreateProduct = function (product) {
    $scope.currentProduct = product ? product : emptyProduct();
    $scope.displayMode = "edit";
  }

  $scope.saveEdit = function (product) {
    if (angular.isDefined(product._id)) {
      updateProduct(product);
    } else {
      createProduct(product);
    }
    $scope.toBeAddedPestType = "";
  }

  $scope.cancelEdit = function () {
    if ($scope.currentProduct && $scope.currentProduct.$get) {
      $scope.currentProduct.$get();  
      // some time if use modified contents in table, need to HTTP GET original data again
    }
    $scope.currentProduct = emptyProduct();
    $scope.displayMode = "list";
    $scope.toBeAddedPestType = "";
  }

  $scope.toggleEntryInArray = function(entry, array) {
    if (!angular.isDefined(entry) || !angular.isDefined(array)) {
      console.error("arguments of toggleEntryInArray() are invalid");
      return;
    }
    var idx = array.indexOf(entry);
    if (idx > -1) {
      array.splice(idx, 1);
    } else {
      array.push(entry);
    }
    $scope.toBeAddedPestType = "";
  }
  // init view
  $scope.listProducts();
  //- if ($scope.displayMode === "edit") {
  //-   console.log("edit");
  //-   console.log($scope.products);
  //-   angular.forEach($scope.products, function ( product){
  //-     console.log("forEach");
  //-     if (product._id === $scope.page_status.productId) {
  //-       $scope.currentProduct = product;
  //-     }
  //-   });
  //-   if ($scope.currentProduct === null) {
  //-     $scope.page_status.productId = null;
  //-     $scope.displayMode = "list";
  //-   }
  //- }
});
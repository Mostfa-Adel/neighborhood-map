var locs = [{
        title: 'Abdeen Palace',
        address: 'El-Gomhoreya Square, Rahbet Abdin, Abdeen, Cairo Governorate',
        position: { lat: 30.042578, lng: 31.245968 }
    },
    {
        title: 'Egyptian Museum Cairo',
        address: '15 Meret Basha, Ismailia, Qasr an Nile, Cairo Governorate',
        position: { lat: 30.047848, lng: 31.233616 }
    },
    {
        title: 'Giza Zoo',
        address: 'Charles De Gaulle, Oula, Giza, Giza Governorate 12612',
        position: { lat: 30.0254601, lng: 31.2164742 }
    },
    {
        title: 'Salah El Din Al Ayouby Citadel',
        address: 'Al Abageyah, Qesm Al Khalifah، Cairo Governorate, Egypt',
        position: { lat: 30.045688, lng: 31.2604964 }
    },
    {
        title: 'Opera Land',
        address: 'Opera Land، EL GEZIRAH، Zamalek, Cairo Governorate, Egypt',
        position: { lat: 30.0426678, lng: 31.2239883 }
    }

];
google_maps_key = "AIzaSyDh8jsdlTrxxq2Caj36pKHJ2Yv1MlJz_Bc";

// google maps scripts loading error handling
function handleLoadMapFailure() {
    alert("failed to load google map, check your network connection and try again");
}
// for foursquare apis
var client_id = '4VQKVVGQHZC3JB0U0HNXEXJQ5LLOKACJY04FN1QUZLED5QYL';
var client_secret = 'FOPOT0MSJTFOHO1OKCLRAK5PLMVT1ZUDE5DKD2H0Q0F3JBEO';
var i; // for for loop counter
// initialize google Map
var map;
var infoWindow;
var markers = [];
// prepare string that will be dispalyd into infoWindow
function prepareInfoContent(title, tip, imgUrl) {
    var content = "";
    content = "<div class='infoWindow'>" +
        "<h3>" + title + "</h3>" +
        "<img id='infoImg' alt='location img' src='" + imgUrl + "'>" +
        "<h3>Tip:</h3>" +
        "<p class='tip'>" + tip + "</p></div>";
    return content;
}

function populateInfoWindow(marker, infoWindow) {
    // set marker animated
    if (infoWindow.marker !== marker || infoWindow.getMap() === null) {
        // set bounce for all markers to null and animate the passed argument one
        markers.forEach(function(marker) {
            if (marker.getAnimation() !== null) {
                marker.setAnimation(null);
            }
        });
        marker.setAnimation(google.maps.Animation.BOUNCE);
        // prepare marker requirements to populate its informations
        index = markers.findIndex(function(m) {
            return m === marker;
        });
        AjaxRequestForContent(index); //it sets infowindow content too
        infoWindow.marker = marker;
        infoWindow.open(map, marker);
        infoWindow.addListener('closeclick', function() {
            this.marker.setAnimation(null);
            this.close();
        });
    }
}

function AjaxRequestForContent(index) {
    // if data not exist in locs list request it by ajax and set content
    // else set content
    infoWindow.setContent("");
    if (locs[index].tips === undefined || locs[index].imgUrl === undefined) {
        // make ajax request to foursquare
        var ll = locs[index].position.lat + ',' + locs[index].position.lng;
        var venue_id = 0;
        $.ajax({
            url: 'https://api.foursquare.com/v2/venues/search',
            data: {
                client_id: client_id,
                client_secret: client_secret,
                ll: ll,
                v: "20170801",
                limit: 1
            },
            success: function(res) {
                venue_id = res.response.venues[0].id;
                // foursquare ajax request for a tip
                $.ajax({
                    url: 'https://api.foursquare.com/v2/venues/' + venue_id + '/tips',
                    data: {
                        client_id: client_id,
                        client_secret: client_secret,
                        v: "20170801",
                        limit: 1
                    },
                    method: 'get',
                    success: function(res) {
                        var tips = res.response.tips.items;
                        locs[index].tips = [];
                        tips.forEach(function(tip) {
                            locs[index].tips.push(tip.text);
                        });
                        var tip = (locs[index].tips)[0] || "no tips found";
                        content = prepareInfoContent(locs[index].title, tip, locs[index].imgUrl || "#");
                        infoWindow.setContent(content);
                    }
                }).error(function() {
                    alert("filed to load the image check network connection");
                });

                // foursquare ajax erquest for location image
                $.ajax({
                    url: 'https://api.foursquare.com/v2/venues/' + venue_id + '/photos',
                    data: {
                        client_id: client_id,
                        client_secret: client_secret,
                        v: "20170801",
                        limit: 1
                    },
                    method: 'get',
                    success: function(res) {
                        var photo = res.response.photos.items[0];
                        var imgUrl = photo.prefix + 'width200' + photo.suffix;
                        locs[index].imgUrl = imgUrl;
                        var tip = ((locs[index].tips) || "")[0];
                        content = prepareInfoContent(locs[index].title, tip, locs[index].imgUrl || "#");
                        infoWindow.setContent(content);
                    }
                }).error(function() {
                    alert("filed to load the tip check network connection");
                });
            }
        }).error(function() {
            alert("Failed to load foursquare informations!");
        });
    } else {
        var content = prepareInfoContent(locs[index].title, locs[index].tips[0], locs[index].imgUrl);
        infoWindow.setContent(content);
    }
}

function initMap() {
    // Create a map object and specify the DOM element for display.
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 30.0444196,
            lng: 31.2357116
        },
        zoom: 13
    });
    var bounds = new google.maps.LatLngBounds();
    infoWindow = new google.maps.InfoWindow();

    function markerClickHandler() {
        populateInfoWindow(this, infoWindow);
    }
    for (i = 0; i < locs.length; i++) {
        var marker = new google.maps.Marker({
            id: i,
            position: locs[i].position,
            map: map,
            title: locs[i].title,
            animation: google.maps.Animation.DROP
        });
        markers.push(marker);
        bounds.extend(marker.position);
        marker.addListener('click', markerClickHandler);
    }
    map.fitBounds(bounds);
}

// knockout app
var app = function() {
    // Model starts here
    var nav_is_open = window.getComputedStyle(nav, null).getPropertyValue('position') == 'relative';
    this.is_open = ko.observable(nav_is_open);
    this.currentLoc = ko.observable(locs[0]);
    this.searchText = ko.observable("");

    // viewModel starst here
    var self = this;
    this.currentList = ko.computed(function() {
        // set all markers on the map visible
        markers.forEach(function(marker) {
            marker.setVisible(true);
        });
        // if there is a text on search field filter
        if (self.searchText().length) {
            var temp = [];
            for (i = 0; i < locs.length; i++) {
                var locMatch = (locs[i].title.indexOf(self.searchText()) > -1);
                locMatch ? temp.push(locs[i]) : markers[i].setVisible(false);
            }
            return temp;
        }
        return locs;
    }, this);

    // to toggle nav visiblity
    this.chang_state = function() {
        this.is_open(!this.is_open());
    };

    this.changeCurrentLoc = function(loc) {
        self.currentLoc(loc);
        index = locs.findIndex(function(x) {
            return x === loc;
        });
        var marker = markers[index];
        populateInfoWindow(marker, infoWindow);
    };
};
ko.applyBindings(new app());
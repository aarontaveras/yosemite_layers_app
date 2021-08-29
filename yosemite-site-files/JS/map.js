// Begin JavaScript Document

/////////////////////////////////////////////////////////////
// MAP ACCESS TOKEN & BOUNDS
/////////////////////////////////////////////////////////////

// Initiate map
mapboxgl.accessToken = 'pk.eyJ1IjoiYWFyb250YXZlcmFzIiwiYSI6ImNrc3doMnZqYzEyeW8yeXMybTVybGg4bHYifQ.ONQjSw-O7Z7b5a3nUOBcKw';

var bounds = [
	[-120.877490, 37.227085], // Southwest coordinates
	[-118.153135, 38.458969] // Northeast coordinates
];

/////////////////////////////////////////////////////////////
// MAP
/////////////////////////////////////////////////////////////

var map = new mapboxgl.Map({
	container: 'map',
	style: 'mapbox://styles/mapbox/streets-v11',
	center: [-119.573159, 37.739671],
	zoom: 11,
	minZoom: 10,
	maxZoom: 16,
	maxBounds: bounds
});

// Add zoom controls
map.addControl(new mapboxgl.NavigationControl());

// Add scale bar
var scale = new mapboxgl.ScaleControl({
    unit: 'imperial'
});

map.addControl(scale, 'bottom-right');

/////////////////////////////////////////////////////////////
// LOAD POINT LAYERS
/////////////////////////////////////////////////////////////

map.on('style.load', function () {
	map.addSource("points", {
		type: "geojson",
		data: "https://raw.githubusercontent.com/aarontaveras/yosemite_poi/master/yosemite_poi_update.geojson"
	});

	map.addLayer({
		"id": "drinking",
		"type": "symbol",
		"source": "points",
		"filter": ["==", "$type", "Point"],
		"layout": {
			"icon-image": "Water-source-icon",
			"icon-size": 1,
			"icon-anchor": "bottom",
			"visibility": "none",
		}
	});

	map.setFilter("drinking", ['==', 'TYPE', 'drinking_water']); // layer, attribute, name

	map.addLayer({
		"id": "high_camp",
		"type": "symbol",
		"source": "points",
		"filter": ["==", "$type", "Point"],
		"layout": {
			"icon-image": "High-camp-icon",
			"icon-size": 1,
			"icon-anchor": "bottom",
			"visibility": "none",
		}
	});

	map.setFilter('high_camp', ['==', 'TYPE', 'high_camp']); // layer, attribute, name

	map.addLayer({
		"id": "climbing_area",
		"type": "symbol",
		"source": "points",
		"filter": ["==", "$type", "Point"],
		"layout": {
			"icon-image": "Climbing-icon",
			"icon-size": 1,
			"icon-anchor": "bottom",
			"visibility": "none",
		}
	});

	map.setFilter('climbing_area', ['==', 'TYPE', 'climbing_area']); // layer, attribute, name

	map.addLayer({
		"id": "camp_site",
		"type": "symbol",
		"source": "points",
		"filter": ["==", "$type", "Point"],
		"layout": {
			"icon-image": "Campsite-icon",
			"icon-size": 1,
			"icon-anchor": "bottom",
			"visibility": "none",
		}
	});

	map.setFilter('camp_site', ['==', 'TYPE', 'camp_site']); // layer, attribute, name

	map.addLayer({
		"id": "ranger_station",
		"type": "symbol",
		"source": "points",
		"filter": ["==", "$type", "Point"],
		"layout": {
			"icon-image": "Ranger-station-icon",
			"icon-size": 1,
			"icon-anchor": "bottom",
			"visibility": "none",
		}
	});

	map.setFilter('ranger_station', ['==', 'TYPE', 'ranger_station']); // layer, attribute, name

	map.addLayer({
		"id": "toilet",
		"type": "symbol",
		"source": "points",
		"filter": ["==", "$type", "Point"],
		"layout": {
			"icon-image": "Bathroom-icon",
			"icon-size": 1,
			"icon-anchor": "bottom",
			"visibility": "none",
		}
	});

	map.setFilter('toilet', ['==', 'TYPE', 'toilet']); // layer, attribute, name

	map.addLayer({
		"id": "permit_station",
		"type": "symbol",
		"source": "points",
		"filter": ["==", "$type", "Point"],
		"layout": {
			"icon-image": "Permit-icon",
			"icon-size": 1,
			"icon-anchor": "bottom",
			"visibility": "none",
		}
	});

	map.setFilter('permit_station', ['==', 'TYPE', 'permit_station']); // layer, attribute, name

	map.addLayer({
		"id": "services",
		"type": "symbol",
		"source": "points",
		"filter": ["==", "$type", "Point"],
		"layout": {
			"icon-image": "Market-icon",
			"icon-size": 1,
			"icon-anchor": "bottom",
			"visibility": "none",
		}
	});

	// Multiple array filter
	var typeFilter = ['match', ['get', 'TYPE'],
		['convenience', 'supermarket'], true, false
	];
	map.setFilter("services", typeFilter);
});

/////////////////////////////////////////////////////////////
// LOAD ALL POINT LAYERS WITH NAMES FOR LIST
/////////////////////////////////////////////////////////////

var stores = "https://raw.githubusercontent.com/aarontaveras/yosemite_trailheads/master/yosemite_trailheads_update.geojson";

map.on('load', () => {
	fetch(stores)
		.then(response => response.json())
		.then((data) => {
			map.addSource("locations", {
				type: 'geojson',
				data: data
			});

			map.addLayer({
				"id": "locations",
				"type": "symbol",
				"source": "locations",
				"minzoom": 14,
				"layout": {
					'icon-image': 'Trailhead-icon',
					"icon-size": 1,
					"icon-anchor": "bottom",
					'icon-allow-overlap': true,
				}
			});

			// Initialize the list
			buildLocationList(data);
		});
});

/////////////////////////////////////////////////////////////
// ADD EVENT LISTENER FOR WHEN A USER CLICKS ON THE MAP
/////////////////////////////////////////////////////////////

map.on('click', function (e) {
	var features = map.queryRenderedFeatures(e.point, {
		layers: ["locations"]
	});

	if (features.length) {
		var clickedPoint = features[0];
		// 1. Fly to the point
		flyToStore(clickedPoint);

		// 2. Close all other popups and display popup for clicked store
		createPopUp(clickedPoint);

		// 3. Highlight listing in sidebar (and remove highlight for all other listings)
		var activeItem = document.getElementsByClassName('active');
		if (activeItem[0]) {
			activeItem[0].classList.remove('active');
		}

		var selectedFeature = clickedPoint.properties.address;

		for (var i = 0; i < stores.features.length; i++) {
			if (stores.features[i].properties.address === selectedFeature) {
				selectedFeatureIndex = i;
			}
		}

		var listing = document.getElementById('listing-' + selectedFeatureIndex);
		listing.classList.add('active');
	}
});

/////////////////////////////////////////////////////////////
// FLYTO CURRENT SELECTED LOCATION
/////////////////////////////////////////////////////////////

function flyToStore(currentFeature) {
	map.flyTo({
		center: currentFeature.geometry.coordinates,
		zoom: 15
	});
}

/////////////////////////////////////////////////////////////
// CREATE POPUP DURING FLYTO
/////////////////////////////////////////////////////////////

function createPopUp(currentFeature) {
	var popUps = document.getElementsByClassName('mapboxgl-popup');
	if (popUps[0]) popUps[0].remove();

	var popup = new mapboxgl.Popup({
		offset: {
			'top': [0, 0],
			'top-left': [0, 0],
			'top-right': [0, 0],
			'bottom': [0, -40],
			'bottom-left': [0, -40],
			'bottom-right': [0, -40],
			'left': [18, -22],
			'right': [-18, -22],
		}
	})

	.setLngLat(currentFeature.geometry.coordinates)
		.setHTML(currentFeature.properties.NAME)
		.addTo(map);
}

/////////////////////////////////////////////////////////////
// BUILD LIST FROM GEOJSON PROPERTIES & ADD LISTENER
/////////////////////////////////////////////////////////////

function buildLocationList(data) {
	for (i = 0; i < data.features.length; i++) {
		// Create an array of all the stores and their properties
		var currentFeature = data.features[i];
		// Shorten data.feature.properties to just `prop` so we're not
		// writing this long form over and over again.
		var prop = currentFeature.properties;
		// Select the listing container in the HTML
		var listings = document.getElementById('listings');
		// Append a div with the class 'item' for each store
		var listing = listings.appendChild(document.createElement('div'));
		listing.className = 'item';
		listing.id = "listing-" + i;

		// Create a new link with the class 'title' for each store
		// and fill it with the store address
		var link = listing.appendChild(document.createElement('a'));
		link.href = '#';
		link.className = 'title';
		link.dataPosition = i;
		link.innerHTML = prop.NAME;

		// Create a new div with the class 'details' for each store
		// and fill it with the city and phone number
		var details = listing.appendChild(document.createElement('div'));
		details.innerHTML = prop.PARKING;
		//if (prop.phone) {
		//details.innerHTML += ' &middot; ' + prop.phoneFormatted;
		//}

		// Create event listener for clicked location
		link.addEventListener('click', function (e) {
			// Update the currentFeature to the store associated with the clicked link
			var clickedListing = data.features[this.dataPosition];

			// 1. Fly to the point associated with the clicked link
			flyToStore(clickedListing);

			// 2. Close all other popups and display popup for clicked store
			createPopUp(clickedListing);

			// 3. Highlight listing in sidebar (and remove highlight for all other listings)
			var activeItem = document.getElementsByClassName('active');

			if (activeItem[0]) {
				activeItem[0].classList.remove('active');
			}
			this.parentNode.classList.add('active');

		});
	}
}

/////////////////////////////////////////////////////////////
// ADD POPUPS TO ALL ACTIVE ICONS
/////////////////////////////////////////////////////////////

map.on('click', function (e) {
	var features = map.queryRenderedFeatures(e.point, {
		layers: ["high_camp", "climbing_area", "camp_site", "ranger_station", "services", "toilet", "permit_station"] // Add layers
	});

	if (!features.length) {
		return;
	}

	var feature = features[0];

	var popup = new mapboxgl.Popup({
			offset: {
				'top': [0, 0],
				'top-left': [0, 0],
				'top-right': [0, 0],
				'bottom': [0, -40],
				'bottom-left': [0, -40],
				'bottom-right': [0, -40],
				'left': [18, -22],
				'right': [-18, -22],
			}
		})
		.setLngLat(feature.geometry.coordinates)
		.setHTML(feature.properties.NAME) // Change attribute, properties.'Replace' (Uppercase)
		.addTo(map);
});

/////////////////////////////////////////////////////////////
// MOUSEOVERS
/////////////////////////////////////////////////////////////

map.on('mousemove', function (e) {
	var features = map.queryRenderedFeatures(e.point, {
		layers: ["high_camp", "climbing_area", "locations", "camp_site", "ranger_station", "services", "toilet", "permit_station"] // Add layers
	});

	map.getCanvas().style.cursor = (features.length) ? 'pointer' : '';
});

/////////////////////////////////////////////////////////////
// TOGGLE SINGLE LAYERS
/////////////////////////////////////////////////////////////

// Toggle trailhead layer
var toggledrinkingwaterId = ["drinking"]; // Add layer

document.getElementById("drinkingIcon").onclick = function (e) { // Change button name, getElementById('Replace')
	for (var index in toggledrinkingwaterId) {
		var clickedLayer = toggledrinkingwaterId[index];
		e.preventDefault();
		e.stopPropagation();

		var visibility = map.getLayoutProperty(clickedLayer, 'visibility');

		if (visibility === 'none') {
			map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
			this.className = '';
		} else {
			this.className = 'on';
			map.setLayoutProperty(clickedLayer, 'visibility', 'none');
		}
	}

};

// Toggle high camp layer
var togglehighcampId = ["high_camp"]; // Add layer

document.getElementById("highcampIcon").onclick = function (e) { // Change button name, getElementById('Replace')
	for (var index in togglehighcampId) {
		var clickedLayer = togglehighcampId[index];
		e.preventDefault();
		e.stopPropagation();

		var visibility = map.getLayoutProperty(clickedLayer, 'visibility');

		if (visibility === 'none') {
			map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
			this.className = '';
		} else {
			this.className = 'on';
			map.setLayoutProperty(clickedLayer, 'visibility', 'none');
		}
	}

};

// Toggle climbing area layer
var toggleclimbingId = ["climbing_area"]; // Add layer

document.getElementById("climbingIcon").onclick = function (e) { // Change button name, getElementById('Replace')
	for (var index in toggleclimbingId) {
		var clickedLayer = toggleclimbingId[index];
		e.preventDefault();
		e.stopPropagation();

		var visibility = map.getLayoutProperty(clickedLayer, 'visibility');

		if (visibility === 'none') {
			map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
			this.className = '';
		} else {
			this.className = 'on';
			map.setLayoutProperty(clickedLayer, 'visibility', 'none');
		}
	}

};

// Toggle campsite area layer
var togglecampsiteId = ["camp_site"]; // Add layer

document.getElementById("campsiteIcon").onclick = function (e) { // Change button name, getElementById('Replace')
	for (var index in togglecampsiteId) {
		var clickedLayer = togglecampsiteId[index];
		e.preventDefault();
		e.stopPropagation();

		var visibility = map.getLayoutProperty(clickedLayer, 'visibility');

		if (visibility === 'none') {
			map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
			this.className = '';
		} else {
			this.className = 'on';
			map.setLayoutProperty(clickedLayer, 'visibility', 'none');
		}
	}

};

// Toggle climbing area layer
var togglerangerId = ["ranger_station"]; // Add layer

document.getElementById("rangerIcon").onclick = function (e) { // Change button name, getElementById('Replace')
	for (var index in togglerangerId) {
		var clickedLayer = togglerangerId[index];
		e.preventDefault();
		e.stopPropagation();

		var visibility = map.getLayoutProperty(clickedLayer, 'visibility');

		if (visibility === 'none') {
			map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
			this.className = '';
		} else {
			this.className = 'on';
			map.setLayoutProperty(clickedLayer, 'visibility', 'none');
		}
	}

};

// Toggle permit station layer
var togglepermitId = ["permit_station"]; // Add layer

document.getElementById("permitIcon").onclick = function (e) { // Change button name, getElementById('Replace')
	for (var index in togglepermitId) {
		var clickedLayer = togglepermitId[index];
		e.preventDefault();
		e.stopPropagation();

		var visibility = map.getLayoutProperty(clickedLayer, 'visibility');

		if (visibility === 'none') {
			map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
			this.className = '';
		} else {
			this.className = 'on';
			map.setLayoutProperty(clickedLayer, 'visibility', 'none');
		}
	}

};

// Toggle toilet layer
var toggletoiletId = ["toilet"]; // Add layer

document.getElementById("bathroomIcon").onclick = function (e) { // Change button name, getElementById('Replace')
	for (var index in toggletoiletId) {
		var clickedLayer = toggletoiletId[index];
		e.preventDefault();
		e.stopPropagation();

		var visibility = map.getLayoutProperty(clickedLayer, 'visibility');

		if (visibility === 'none') {
			map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
			this.className = '';
		} else {
			this.className = 'on';
			map.setLayoutProperty(clickedLayer, 'visibility', 'none');
		}
	}

};

// Toggle food and lodging layer
var toggleservicesId = ["services"]; // Add layer

document.getElementById("marketIcon").onclick = function (e) { // Change button name, getElementById('Replace')
	for (var index in toggleservicesId) {
		var clickedLayer = toggleservicesId[index];
		e.preventDefault();
		e.stopPropagation();

		var visibility = map.getLayoutProperty(clickedLayer, 'visibility');

		if (visibility === 'none') {
			map.setLayoutProperty(clickedLayer, 'visibility', 'visible');
			this.className = '';
		} else {
			this.className = 'on';
			map.setLayoutProperty(clickedLayer, 'visibility', 'none');
		}
	}

};

/////////////////////////////////////////////////////////////
// UTILITIES
/////////////////////////////////////////////////////////////

// Initiate focus for keyboard users
function handleFirstTab(e) {
	if (e.keyCode === 9) {
		document.body.classList.add('user-is-tabbing');
		window.removeEventListener('keydown', handleFirstTab);
	}
}

window.addEventListener('keydown', handleFirstTab);

// Keep button active when clicked
$('button').click(function () {
	if ($(this).hasClass('on')) {
		$(this).removeClass('on');
	} else {
		$(this).addClass('on');
	}
});

// Search
$(document).ready(function(){
  $("#searchInput").on("keyup", function() {
    var value = $(this).val().toLowerCase();
    $("#listings .item").filter(function() {
      $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
    });
  });
});

// End JavaScript

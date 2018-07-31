import Diva from '../source/js/diva';

// jQuery mimic
let $ = document.getElementById.bind(document);

describe('Hash Params', function ()
{
    beforeEach(function ()
    {
        // reset event subscription so only current test is subscribed
        Diva.Events.unsubscribeAll();

        // recreate diva instance
        let oldDiva = document.getElementById('diva-wrapper');
        oldDiva.parentNode.removeChild(oldDiva);
        let newDiva = document.createElement('div');
        newDiva.id = 'diva-wrapper';
        document.body.appendChild(newDiva);
    });

    var testHashParams = function (testName, hashParams, onReadyCallback, config)
    {
        it(testName, function (done)
        {
            window.location.hash = Object.keys(hashParams).map(function (param)
            {
                return param + '=' + hashParams[param];
            }).join('&');

            let diva = new Diva('diva-wrapper', { // jshint ignore:line
                objectData: 'https://images.simssa.ca/iiif/manuscripts/cdn-hsmu-m2149l4/manifest.json',
                hashParamSuffix: config ? config.hashParamSuffix : ''
            });

            Diva.Events.subscribe('ViewerDidLoad', function (settings)
            {
                var scroll = {
                    left: settings.viewportElement.scrollLeft,
                    top: settings.viewportElement.scrollTop
                };

                onReadyCallback.call(this, settings, scroll);
                done();
            });
        });
    };

    testHashParams('works with hashParamSuffix', {vxyz: 'g', f: 'true'}, function (settings)
    {
        assert.isOk(settings.inGrid, 'Should read properties with the specified suffix');
        assert.isOk(!settings.inFullscreen, 'Should not read properties without it');
    }, {hashParamSuffix: 'xyz'});

    testHashParams("grid view (v)", {v: "g"}, function (settings)
    {
        assert.isOk(settings.inGrid, "inGrid setting should be true");
        assert.strictEqual($(settings.selector + 'view-menu').children[0].classList[0], 'diva-grid-icon', "Current toolbar view icon should be the grid icon");
    });

    testHashParams("book view (v)", {v: "b"}, function (settings)
    {
        assert.isOk(settings.inBookLayout, "inBookLayout setting should be true");
        assert.strictEqual($(settings.selector + 'view-menu').children[0].classList[0], 'diva-book-icon', "Current toolbar view icon should be the book icon");
        assert.isOk(this.isPageInViewport(0), 'There should be some book pages');
    });

    testHashParams("fullscreen (f)", {f: "true"}, function (settings)
    {
        assert.isOk(settings.inFullscreen, "inFullscreen setting should be true");
        assert.isOk(document.body.classList.contains('diva-hide-scrollbar'), "The body element should have the hide-scrollbar class");
    });

    testHashParams("view (v) = 'g' and fullscreen (f)", {v: "g", f: "true"}, function (settings)
    {
        assert.isOk(settings.inFullscreen, "inFullscreen setting should be true");
        assert.isOk(settings.inGrid, "inGrid setting should be true");
    });

    testHashParams("zoom level (z) - valid value", {z: "3"}, function (settings)
    {
        assert.strictEqual(settings.zoomLevel, 3, "Initial zoom level should be 3");
    });

    testHashParams("zoom level (z) - invalid value", {z: "6"}, function (settings)
    {
        assert.strictEqual(settings.zoomLevel, 0, "Initial zoom was invalid but >= 0, should be set to the min (0)");
    });

    testHashParams("zoom level (z) and view (v) = 'g' ", {z: "1", v: "g"}, function (settings)
    {
        assert.strictEqual(settings.zoomLevel, 1, "Initial zoom level should be 1");
        assert.isOk(settings.inGrid, "Should be in grid initially");

        // Now let's switch into document view and see if the zoom level is preserved
        document.getElementsByClassName('diva-document-icon')[0].click();
        assert.strictEqual(settings.zoomLevel, 1, "Zoom level setting should still be 1");
        // zoom level is 0 indexed internally, so setting to 1 should display 2.00
        assert.strictEqual($(settings.selector + 'zoom-label').textContent, "Zoom level: 2", "Zoom buttons label should show a zoom level of 2");
    });

    testHashParams("zoom level (z) and fullscreen (f)", {z: "1", f: "true"}, function (settings)
    {
        assert.strictEqual(settings.zoomLevel, 1, "Initial zoom level should be 1");
        assert.isOk(settings.inFullscreen, "Should be in fullscreen initially");

        // Check that we're actually in fullscreen mode
        assert.isOk(document.body.classList.contains('diva-hide-scrollbar'), "The body element should have the hide-scrollbar class");

        // Check that the zoom level is actually 1 (second zoom)
        assert.strictEqual($(settings.selector + 'zoom-label').textContent, "Zoom level: 2", "Zoom buttons label should show a zoom level of 2");
    });

    testHashParams("pagesPerRow (n) - valid value", {n: "3"}, function (settings)
    {
        assert.strictEqual(settings.pagesPerRow, 3, "Pages per row should be 3 initially");
    });

    testHashParams("pagesPerRow (n) - invalid value", {n: "1"}, function (settings)
    {
        assert.strictEqual(settings.pagesPerRow, 8, "Pages per row should default to the maximum");
    });

    testHashParams("pagesPerRow (n) and view (v) = 'g'", {n: "3", v: "g"}, function (settings)
    {
        assert.strictEqual(settings.pagesPerRow, 3, "Pages per row should be 3 initially");
        assert.isOk(settings.inGrid, "Should be in grid initially");

        // Check that the pages per row setting is actually 3
        assert.strictEqual($(settings.selector + 'grid-label').textContent, "Pages per row: 3", "Grid buttons label should show 3 pages per row");
    });

    testHashParams("page filename (i) - valid value", {i: "https://images.simssa.ca/iiif/image/beromunster/bm_006.tif"}, function (settings)
    {
        assert.strictEqual(settings.currentPageIndex, 5, "The initial page should be page 6 (index of 5)");
    }, {enableFilename: true});

    testHashParams("page filename (i) - invalid value", {i: "https://images.simssa.ca/iiif/image/beromunster/bm_000.tif"}, function (settings)
    {
        assert.strictEqual(settings.currentPageIndex, 0, "The initial page should just be the first page");
    }, {enableFilename: true});

    testHashParams("page number (p) - valid value", {p: "6"}, function (settings)
    {
        assert.strictEqual(settings.currentPageIndex, 5, "The initial page should be page 6 (index of 5)");
    }, {enableFilename: false});

    testHashParams("page number (p) - invalid value", {p: "600"}, function (settings)
    {
        assert.strictEqual(settings.currentPageIndex, 0, "The initial page should just be the first page");
    }, {enableFilename: false});

    testHashParams("page number (p), view = 'g'", {p: "100", v: "g"}, function (settings)
    {
        assert.strictEqual(settings.currentPageIndex, 99, "The initial page should be 100 (index of 99)");
        assert.ok(settings.inGrid, "Should be in grid");
    }, {enableFilename: false});

    testHashParams("horizontal and vertical offsets (x, y) without page specified", {x: 100, y: 200}, function (settings, scroll)
    {
        assert.strictEqual(scroll.top, 0, 'y position should not change');
    });

    testHashParams("vertical offset (y) on first page - positive value", {y: "600", p: "1"}, function (settings, scroll)
    {
        assert.strictEqual(scroll.top, 250, "Should have scrolled 250 (600 = top of page - viewport y-center) vertically");
    });

    testHashParams("vertical offset (y) on first page - negative value", {y: "-600", p: "1"}, function (settings, scroll)
    {
        assert.strictEqual(scroll.top, 0, "Should not have scrolled negatively because, well, you can't");
    });
    testHashParams("vertical offset (y) and page number (p)", {y: 500, p: "50"}, function (settings, scroll)
    {
        var expectedTopScroll = 52922;
        assert.strictEqual(settings.currentPageIndex, 49, "Current page should be 50 (index of 49)");
        assert.strictEqual(scroll.top, expectedTopScroll, "Should be heightAbovePages + 500 pixels of scroll from the top + page y-center");

        // Check that the horizontal scroll hasn't been weirdly affected
        var expectedInnerWidth = settings.manifest.getMaxWidth(settings.zoomLevel) + settings.horizontalPadding * 2;
        var expectedLeftScroll = parseInt((expectedInnerWidth - settings.panelWidth) / 2, 10);
        assert.strictEqual(scroll.left, expectedLeftScroll, "Horizontal scroll should just center it");
    }, {enableFilename: false, zoomLevel: 2});

    testHashParams("horizontal offset (x) on first page - positive value", {x: "100", p: "1"}, function (settings, scroll)
    {
        // FIXME: https://github.com/DDMAL/diva.js/issues/331
        assert.strictEqual(scroll.left, 0, "Horizontal scroll should center it + 100 pixels to the right");
    });

    testHashParams("horizontal offset (x) on first page - negative value", {x: "-100", p: "1"}, function (settings, scroll)
    {
        // FIXME: https://github.com/DDMAL/diva.js/issues/331
        assert.strictEqual(scroll.left, 0, "Horizontal scroll should center it + 100 pixels to the left");
    });

    testHashParams("horizontal offset (x) and page number (p)", {x: 100, p: "50"}, function (settings, scroll)
    {
        // FIXME: https://github.com/DDMAL/diva.js/issues/331
        var expectedTopScroll = 52772;
        assert.strictEqual(scroll.top, expectedTopScroll, "vertical scroll should be just to page 50");
        assert.strictEqual(scroll.left, 0, "Horizontal scroll should center it + 100 pixels to the right");
    }, {enableFilename: false});

    testHashParams("horizontal offset (x), vertical offset (y), page number (p)", {x: 100, y: 200, p: "50"}, function (settings, scroll)
    {
        // FIXME: https://github.com/DDMAL/diva.js/issues/331
        var expectedTopScroll = 52622;
        assert.strictEqual(scroll.top, expectedTopScroll, "vertical scroll should be to page 50 + 200 + page y-center");
        assert.strictEqual(scroll.left, 0, "Horizontal scroll should center it + 100 pixels to the right");
    }, {enableFilename: false});
});
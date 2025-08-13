// BeforeAfter class definition
class BeforeAfter {
    constructor(enteryObject) {
      const beforeAfterContainer = document.querySelector(enteryObject.id);
      const before = beforeAfterContainer.querySelector('.bal-before');
      const beforeText = beforeAfterContainer.querySelector('.bal-beforePosition');
      const afterText = beforeAfterContainer.querySelector('.bal-afterPosition');
      const handle = beforeAfterContainer.querySelector('.bal-handle');
      let widthChange = 0;
  
      function updateInsetWidth() {
        beforeAfterContainer.querySelector('.bal-before-inset').style.width = `${beforeAfterContainer.offsetWidth}px`;
      }
  
      updateInsetWidth();
      window.onresize = updateInsetWidth;
  
      before.style.width = "50%";
      handle.style.left = "50%";
  
      // Touch events
      beforeAfterContainer.addEventListener("touchstart", () => {
        beforeAfterContainer.addEventListener("touchmove", (e2) => {
          let containerWidth = beforeAfterContainer.offsetWidth;
          let currentPoint = e2.changedTouches[0].clientX;
          let modifiedCurrentPoint = currentPoint - beforeAfterContainer.offsetLeft;
  
          if (modifiedCurrentPoint > 10 && modifiedCurrentPoint < containerWidth - 10) {
            let newWidth = (modifiedCurrentPoint * 100) / containerWidth;
            before.style.width = `${newWidth}%`;
            afterText.style.zIndex = "1";
            handle.style.left = `${newWidth}%`;
          }
        });
      });
  
      // Mouse events
      beforeAfterContainer.addEventListener('mousemove', (e) => {
        let containerWidth = beforeAfterContainer.offsetWidth;
        widthChange = e.offsetX;
        let newWidth = (widthChange * 100) / containerWidth;
  
        if (e.offsetX > 10 && e.offsetX < containerWidth - 10) {
          before.style.width = `${newWidth}%`;
          afterText.style.zIndex = "1";
          handle.style.left = `${newWidth}%`;
        }
      });
    }
}
  
// DOMContentLoaded Initialization
$(document).ready(function() {
    // Navbar burger toggle
    $(".navbar-burger").click(function() {
      $(".navbar-burger, .navbar-menu").toggleClass("is-active");
    });
    
    // Carousel initialization
    const options = {
      slidesToScroll: 1,
      slidesToShow: 1,
      centerMode: true,
      loop: true,
      infinite: true,
      autoplay: false,
      autoplaySpeed: 3000,
    };
    
    const carousels = bulmaCarousel.attach('.carousel', options);
    carousels.forEach(carousel => {
      carousel.on('before:show', state => {
        // console.log(state);

        // Restart video if carousel is current
        const totalIndexes = Array.from({ length: state.length }, (_, i) => i);
        
        cur_index = state.next;
        if (cur_index == state.length) cur_index = 0;
        if (cur_index < 0) cur_index = state.length-1;

        pre_indexes = totalIndexes.filter(index => index !== cur_index);
        
        console.log(cur_index);
        console.log(pre_indexes);        

        pre_indexes.forEach(pre_index => {
          const pre_video = document.querySelectorAll('#demo-carousel-video #video-' + pre_index)[0];
          if (pre_video) {
            pre_video.currentTime = 0;
            pre_video.pause();
          }
        });

        const cur_video = document.querySelectorAll('#demo-carousel-video #video-' + cur_index)[0];
        if (cur_video) {
          cur_video.play();
        };
      });
    });
    
    // Access to bulmaCarousel instance of an element
    const element = document.querySelector('#my-element');
    if (element && element.bulmaCarousel) {
      element.bulmaCarousel.on('before-show', function(state) {
        console.log(state);
      });
    }
    
    bulmaSlider.attach();
});
  
// Dataset Controls and Updates
const datasets = {
  'Waymo': { scenes: ['81', '226', '362'], cameras: ['1', '3', '5'] },
  'KITTI-360': { scenes: ['Straight', 'Large rotation', 'Large zigzag', 'Small rotation', 'Small zigzag'], cameras: ['1', '2', '4'] },
  'Custom': { scenes: ['00', '03'], cameras: ['1', '3'] },
  // 'PandaSet': { scenes: ['033', '040', '053'], cameras: ['1', '3', '5'] },
  // 'NuScenes': { scenes: ['000', '003'], cameras: ['1', '3', '5'] },
};

let activeDataset = 'Waymo', activeScene = '81', activeCameras = '5';

function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = reject;
    img.src = url;
  });
}
  
async function updateVideo() {
  const video = document.getElementById('result-video');
  const posterUrl = `./videos/results/${activeDataset.toLowerCase()}/${activeScene.toLowerCase()}.jpg`;
  const videoSrc = `./videos/results/${activeDataset.toLowerCase()}/${activeScene.toLowerCase()}_comp.mp4`;

  if (video) {
    await preloadImage(posterUrl);
    video.poster = posterUrl;
    video.src = videoSrc;
  }
}

function updateImage() {
  document.getElementById('comparison1').src = `./images/${activeDataset.toLowerCase()}/${activeScene.toLowerCase()}_ours.png`;
  document.getElementById('comparison2').src = `./images/${activeDataset.toLowerCase()}/${activeScene.toLowerCase()}_gt.png`;
  
  // Initialize bal-handle position at image center
  const balHandle = document.querySelector('#bal_comparison .bal-handle');
  if (balHandle) balHandle.style.left = '50%';

  const balBefore = document.querySelector('#bal_comparison .bal-before');
  if (balBefore) balBefore.style.width = '50%';

  // Adjust bal-container-small height based on activeDataset
  const balContainerSmall = document.querySelector('.bal-container-small');
  if (balContainerSmall) {
    let height;
    if (activeDataset === 'Waymo') {
      height = '500px';
    } else if (activeDataset === 'KITTI-360') {
      height = '300px';
    } else if (activeDataset === 'Custom') {
      height = '550px';
    } else {
      height = '500px'; // Default height
    }

    // Check if the device is mobile
    if (window.innerWidth <= 768) {
      const numericHeight = parseInt(height, 10);
      height = `${numericHeight / 2.5}px`;
    }

    balContainerSmall.style.height = height;
  }
}

function updateControls() {
  const sceneSelect = document.getElementById('scene-select');
  //const camerasSelect = document.getElementById('cameras-select');
  const commonMessage = document.getElementById('common-message');
  const customMessage = document.getElementById('custom-message');
  const nuscenesMessage = document.getElementById('nuscenes-message');
  
  // Update scene options
  sceneSelect.innerHTML = datasets[activeDataset].scenes.map(scene => `<option value="${scene}">${scene}</option>`).join('');
  sceneSelect.value = activeScene;
  
//   // Update camera options
//   camerasSelect.innerHTML = datasets[activeDataset].cameras.map(count => `<option value="${count}">${count} camera${count !== '1' ? 's' : ''}</option>`).join('');
//   camerasSelect.value = activeCameras;

  // Show/hide message
  commonMessage.style.display = activeDataset === 'Waymo' || activeDataset === 'KITTI-360' ? 'block' : 'none';
  customMessage.style.display = activeDataset === 'Custom' ? 'block' : 'none';
  nuscenesMessage.style.display = activeDataset === 'NuScenes' ? 'block' : 'none';
}

// Dataset button click handler
document.querySelectorAll('.dataset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelector('.dataset-btn.active').classList.remove('active');
    btn.classList.add('active');
    activeDataset = btn.dataset.dataset;
    activeScene = datasets[activeDataset].scenes[0];
    activeCameras = datasets[activeDataset].cameras.slice(-1)[0];
    updateControls();
    updateVideo();
    updateImage();
  });
});

document.getElementById('scene-select').addEventListener('change', (e) => {
  activeScene = e.target.value;
  updateVideo();
  updateImage();
});

/*
document.getElementById('cameras-select').addEventListener('change', (e) => {
activeCameras = e.target.value;
updateVideo();
});
*/

// Initialize controls and video
updateControls();
updateVideo();
updateImage();

// Initialize BeforeAfter
new BeforeAfter({
  id: '#bal_comparison'
});
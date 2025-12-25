/**
 * Solar System - 3D Sun with Orbiting Planets and Asteroids
 * A stunning miniature solar system with interactive camera controls
 */

const SolarOrbit = {
    scene: null,
    camera: null,
    renderer: null,
    sun: null,
    planets: [],
    asteroids: [],
    particles: null,
    coronaParticles: null,
    time: 0,

    // Camera orbital controls
    cameraControls: {
        isDragging: false,
        previousMousePosition: { x: 0, y: 0 },
        spherical: {
            radius: 25,
            theta: 0.3,
            phi: 1.1
        },
        target: { x: 0, y: 0, z: 0 },
        damping: 0.08,
        rotateSpeed: 0.005,
        zoomSpeed: 1.0,
        minRadius: 8,
        maxRadius: 60,
        minPhi: 0.2,
        maxPhi: Math.PI - 0.2,
        targetSpherical: {
            radius: 25,
            theta: 0.3,
            phi: 1.1
        }
    },

    validationState: {
        emailValid: false,
        passwordStrong: false,
        allConditionsMet: false
    },

    // Planet definitions with realistic-ish proportions
    planetData: [
        {
            name: 'Mercury',
            distance: 3.5,
            size: 0.15,
            speed: 1.6,
            color: 0x8C7853,
            emissive: 0x000000,
            tilt: 0.03,
            rotationSpeed: 0.01,
            hasAtmosphere: false
        },
        {
            name: 'Venus',
            distance: 5,
            size: 0.35,
            speed: 1.2,
            color: 0xE6C87A,
            emissive: 0x1a1500,
            tilt: 0.05,
            rotationSpeed: -0.004, // Retrograde rotation
            hasAtmosphere: true,
            atmosphereColor: 0xFFE4B5
        },
        {
            name: 'Earth',
            distance: 7,
            size: 0.38,
            speed: 1.0,
            color: 0x4169E1,
            emissive: 0x001122,
            tilt: 0.08,
            rotationSpeed: 0.02,
            hasAtmosphere: true,
            atmosphereColor: 0x87CEEB,
            hasMoon: true,
            moonDistance: 0.8,
            moonSize: 0.1,
            moonSpeed: 3.0,
            moonColor: 0xAAAAAA
        },
        {
            name: 'Mars',
            distance: 9.5,
            size: 0.25,
            speed: 0.8,
            color: 0xCD5C5C,
            emissive: 0x110000,
            tilt: 0.06,
            rotationSpeed: 0.019,
            hasAtmosphere: true,
            atmosphereColor: 0xFFCCCC
        },
        {
            name: 'Jupiter',
            distance: 14,
            size: 0.9,
            speed: 0.45,
            color: 0xD2691E,
            emissive: 0x110800,
            tilt: 0.02,
            rotationSpeed: 0.04,
            hasAtmosphere: true,
            atmosphereColor: 0xFFE4C4,
            hasMoons: true,
            moonCount: 4
        },
        {
            name: 'Saturn',
            distance: 19,
            size: 0.75,
            speed: 0.32,
            color: 0xF4D03F,
            emissive: 0x111100,
            tilt: 0.1,
            rotationSpeed: 0.038,
            hasRings: true,
            ringInnerRadius: 1.2,
            ringOuterRadius: 2.0,
            ringColor: 0xC4A35A
        },
        {
            name: 'Uranus',
            distance: 24,
            size: 0.5,
            speed: 0.22,
            color: 0x5DADE2,
            emissive: 0x001111,
            tilt: 1.7, // Extreme tilt like real Uranus
            rotationSpeed: 0.03,
            hasRings: true,
            ringInnerRadius: 1.1,
            ringOuterRadius: 1.4,
            ringColor: 0x888899
        },
        {
            name: 'Neptune',
            distance: 28,
            size: 0.48,
            speed: 0.18,
            color: 0x3498DB,
            emissive: 0x000022,
            tilt: 0.05,
            rotationSpeed: 0.032,
            hasAtmosphere: true,
            atmosphereColor: 0x6699FF
        }
    ],

    init() {
        console.log('SolarSystem: Initializing...');

        const container = document.querySelector('.login-left');
        if (!container || typeof THREE === 'undefined') {
            console.warn('Three.js or container not found');
            return;
        }

        this.setupScene(container);
        this.createSun();
        this.createPlanets();
        this.createAsteroidBelt();
        this.createStarfield();
        this.createCoronaParticles();
        this.setupEventListeners();
        this.setupCameraControls();
        this.animate();

        console.log('SolarSystem: Initialization complete!');
    },

    setupScene(container) {
        this.scene = new THREE.Scene();

        // Camera with wider FOV for bigger scene
        this.camera = new THREE.PerspectiveCamera(
            60,
            container.offsetWidth / container.offsetHeight,
            0.1,
            1000
        );

        this.updateCameraPosition();

        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(container.offsetWidth, container.offsetHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 0);

        // Enable pointer events for dragging
        this.renderer.domElement.style.position = 'absolute';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.pointerEvents = 'auto';
        this.renderer.domElement.style.cursor = 'grab';
        container.style.position = 'relative';
        container.insertBefore(this.renderer.domElement, container.firstChild);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x222233, 0.3);
        this.scene.add(ambientLight);

        // Main sun light
        this.sunLight = new THREE.PointLight(0xFFDD88, 2.5, 200);
        this.sunLight.position.set(0, 0, 0);
        this.scene.add(this.sunLight);

        // Store container
        this.container = container;
    },

    setupCameraControls() {
        const canvas = this.renderer.domElement;

        canvas.addEventListener('mousedown', (e) => {
            this.cameraControls.isDragging = true;
            this.cameraControls.previousMousePosition = { x: e.clientX, y: e.clientY };
            canvas.style.cursor = 'grabbing';
        });

        window.addEventListener('mouseup', () => {
            this.cameraControls.isDragging = false;
            canvas.style.cursor = 'grab';
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!this.cameraControls.isDragging) return;

            const deltaX = e.clientX - this.cameraControls.previousMousePosition.x;
            const deltaY = e.clientY - this.cameraControls.previousMousePosition.y;

            this.cameraControls.targetSpherical.theta -= deltaX * this.cameraControls.rotateSpeed;
            this.cameraControls.targetSpherical.phi += deltaY * this.cameraControls.rotateSpeed;

            this.cameraControls.targetSpherical.phi = Math.max(
                this.cameraControls.minPhi,
                Math.min(this.cameraControls.maxPhi, this.cameraControls.targetSpherical.phi)
            );

            this.cameraControls.previousMousePosition = { x: e.clientX, y: e.clientY };
        });

        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();

            const zoomDelta = e.deltaY * 0.01 * this.cameraControls.zoomSpeed;
            this.cameraControls.targetSpherical.radius += zoomDelta;

            this.cameraControls.targetSpherical.radius = Math.max(
                this.cameraControls.minRadius,
                Math.min(this.cameraControls.maxRadius, this.cameraControls.targetSpherical.radius)
            );
        }, { passive: false });

        // Touch support
        canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                this.cameraControls.isDragging = true;
                this.cameraControls.previousMousePosition = {
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY
                };
            }
        });

        canvas.addEventListener('touchend', () => {
            this.cameraControls.isDragging = false;
        });

        canvas.addEventListener('touchmove', (e) => {
            if (!this.cameraControls.isDragging || e.touches.length !== 1) return;

            const deltaX = e.touches[0].clientX - this.cameraControls.previousMousePosition.x;
            const deltaY = e.touches[0].clientY - this.cameraControls.previousMousePosition.y;

            this.cameraControls.targetSpherical.theta -= deltaX * this.cameraControls.rotateSpeed;
            this.cameraControls.targetSpherical.phi += deltaY * this.cameraControls.rotateSpeed;

            this.cameraControls.targetSpherical.phi = Math.max(
                this.cameraControls.minPhi,
                Math.min(this.cameraControls.maxPhi, this.cameraControls.targetSpherical.phi)
            );

            this.cameraControls.previousMousePosition = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        });
    },

    updateCameraPosition() {
        const controls = this.cameraControls;
        const damping = controls.damping;

        controls.spherical.theta += (controls.targetSpherical.theta - controls.spherical.theta) * damping;
        controls.spherical.phi += (controls.targetSpherical.phi - controls.spherical.phi) * damping;
        controls.spherical.radius += (controls.targetSpherical.radius - controls.spherical.radius) * damping;

        const { radius, theta, phi } = controls.spherical;

        this.camera.position.x = radius * Math.sin(phi) * Math.sin(theta);
        this.camera.position.y = radius * Math.cos(phi);
        this.camera.position.z = radius * Math.sin(phi) * Math.cos(theta);

        this.camera.lookAt(controls.target.x, controls.target.y, controls.target.z);
    },

    createSun() {
        const sunGroup = new THREE.Group();

        // Procedural sun texture
        const sunCanvas = document.createElement('canvas');
        sunCanvas.width = 512;
        sunCanvas.height = 512;
        const ctx = sunCanvas.getContext('2d');

        // Radial gradient for sun surface
        const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
        gradient.addColorStop(0, '#FFFFCC');
        gradient.addColorStop(0.2, '#FFEE66');
        gradient.addColorStop(0.4, '#FFCC33');
        gradient.addColorStop(0.6, '#FF9922');
        gradient.addColorStop(0.8, '#FF6600');
        gradient.addColorStop(1, '#CC3300');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);

        // Add surface granulation
        for (let i = 0; i < 3000; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const dist = Math.sqrt((x - 256) ** 2 + (y - 256) ** 2);
            if (dist < 250) {
                const brightness = 180 + Math.random() * 75;
                ctx.fillStyle = `rgba(255, ${brightness}, ${brightness * 0.3}, ${0.15 + Math.random() * 0.3})`;
                ctx.beginPath();
                ctx.arc(x, y, 2 + Math.random() * 10, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const sunTexture = new THREE.CanvasTexture(sunCanvas);

        // Core sun - bigger now
        const sunGeometry = new THREE.SphereGeometry(1.5, 64, 64);
        const sunMaterial = new THREE.MeshBasicMaterial({
            map: sunTexture
        });
        const sunCore = new THREE.Mesh(sunGeometry, sunMaterial);
        sunGroup.add(sunCore);

        // Inner glow
        const glowGeometry = new THREE.SphereGeometry(1.7, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF6600,
            transparent: true,
            opacity: 0.35,
            side: THREE.BackSide
        });
        sunGroup.add(new THREE.Mesh(glowGeometry, glowMaterial));

        // Outer corona
        const coronaGeometry = new THREE.SphereGeometry(2.2, 32, 32);
        const coronaMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF4400,
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide
        });
        sunGroup.add(new THREE.Mesh(coronaGeometry, coronaMaterial));

        // Outer atmosphere
        const atmosphereGeometry = new THREE.SphereGeometry(2.8, 32, 32);
        const atmosphereMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF2200,
            transparent: true,
            opacity: 0.05,
            side: THREE.BackSide
        });
        sunGroup.add(new THREE.Mesh(atmosphereGeometry, atmosphereMaterial));

        sunGroup.userData = {
            core: sunCore,
            pulsePhase: 0,
            intensity: 1,
            texture: sunTexture
        };

        this.sun = sunGroup;
        this.scene.add(sunGroup);
    },

    createPlanets() {
        this.planetData.forEach((data, index) => {
            const planetGroup = new THREE.Group();

            // Create planet texture
            const planetTexture = this.createPlanetTexture(data);

            // Planet geometry
            const geometry = new THREE.SphereGeometry(data.size, 32, 32);
            const material = new THREE.MeshStandardMaterial({
                map: planetTexture,
                roughness: 0.8,
                metalness: 0.1,
                emissive: data.emissive,
                emissiveIntensity: 0.3
            });

            const planet = new THREE.Mesh(geometry, material);
            planetGroup.add(planet);

            // Atmosphere
            if (data.hasAtmosphere) {
                const atmosphereGeometry = new THREE.SphereGeometry(data.size * 1.08, 32, 32);
                const atmosphereMaterial = new THREE.MeshBasicMaterial({
                    color: data.atmosphereColor,
                    transparent: true,
                    opacity: 0.15,
                    side: THREE.BackSide
                });
                planetGroup.add(new THREE.Mesh(atmosphereGeometry, atmosphereMaterial));
            }

            // Rings (Saturn, Uranus)
            if (data.hasRings) {
                const ringGeometry = new THREE.RingGeometry(
                    data.size * data.ringInnerRadius,
                    data.size * data.ringOuterRadius,
                    64
                );

                // Create ring texture
                const ringTexture = this.createRingTexture(data.ringColor);

                const ringMaterial = new THREE.MeshBasicMaterial({
                    map: ringTexture,
                    color: data.ringColor,
                    transparent: true,
                    opacity: 0.7,
                    side: THREE.DoubleSide
                });
                const ring = new THREE.Mesh(ringGeometry, ringMaterial);
                ring.rotation.x = Math.PI / 2;
                planetGroup.add(ring);
            }

            // Moon for Earth
            if (data.hasMoon) {
                const moonGeometry = new THREE.SphereGeometry(data.moonSize, 16, 16);
                const moonMaterial = new THREE.MeshStandardMaterial({
                    color: data.moonColor,
                    roughness: 0.9
                });
                const moon = new THREE.Mesh(moonGeometry, moonMaterial);
                moon.userData = {
                    distance: data.moonDistance,
                    speed: data.moonSpeed,
                    angle: 0
                };
                planetGroup.add(moon);
                planetGroup.userData.moon = moon;
            }

            // Multiple moons for Jupiter
            if (data.hasMoons) {
                const moons = [];
                for (let i = 0; i < data.moonCount; i++) {
                    const moonSize = 0.05 + Math.random() * 0.08;
                    const moonGeometry = new THREE.SphereGeometry(moonSize, 12, 12);
                    const moonMaterial = new THREE.MeshStandardMaterial({
                        color: 0xCCBBAA,
                        roughness: 0.9
                    });
                    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
                    moon.userData = {
                        distance: data.size * 1.5 + i * 0.3,
                        speed: 2 - i * 0.3,
                        angle: (Math.PI * 2 / data.moonCount) * i
                    };
                    planetGroup.add(moon);
                    moons.push(moon);
                }
                planetGroup.userData.moons = moons;
            }

            // Store planet data
            planetGroup.userData = {
                ...planetGroup.userData,
                ...data,
                angle: (Math.PI * 2 / this.planetData.length) * index,
                planet: planet
            };

            this.planets.push(planetGroup);
            this.scene.add(planetGroup);

            // Create orbit path
            this.createOrbitPath(data.distance);
        });
    },

    createPlanetTexture(data) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        // Base color
        const r = (data.color >> 16) & 255;
        const g = (data.color >> 8) & 255;
        const b = data.color & 255;
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(0, 0, 256, 256);

        // Add texture details based on planet type
        if (data.name === 'Earth') {
            // Continents
            ctx.fillStyle = '#228B22';
            for (let i = 0; i < 8; i++) {
                ctx.beginPath();
                ctx.ellipse(
                    50 + Math.random() * 150,
                    50 + Math.random() * 150,
                    20 + Math.random() * 40,
                    15 + Math.random() * 30,
                    Math.random() * Math.PI,
                    0, Math.PI * 2
                );
                ctx.fill();
            }
            // Clouds
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            for (let i = 0; i < 15; i++) {
                ctx.beginPath();
                ctx.ellipse(
                    Math.random() * 256,
                    Math.random() * 256,
                    30 + Math.random() * 50,
                    10 + Math.random() * 20,
                    Math.random() * Math.PI,
                    0, Math.PI * 2
                );
                ctx.fill();
            }
        } else if (data.name === 'Jupiter') {
            // Jupiter bands
            const bands = ['#D2691E', '#CD853F', '#DEB887', '#C4A35A', '#B8860B'];
            for (let y = 0; y < 256; y += 20) {
                ctx.fillStyle = bands[Math.floor(y / 20) % bands.length];
                ctx.fillRect(0, y, 256, 20);
            }
            // Great red spot
            ctx.fillStyle = '#CD5C5C';
            ctx.beginPath();
            ctx.ellipse(180, 130, 40, 25, 0.2, 0, Math.PI * 2);
            ctx.fill();
        } else if (data.name === 'Mars') {
            // Mars surface features
            ctx.fillStyle = '#8B4513';
            for (let i = 0; i < 20; i++) {
                ctx.beginPath();
                ctx.arc(Math.random() * 256, Math.random() * 256, 5 + Math.random() * 15, 0, Math.PI * 2);
                ctx.fill();
            }
        } else if (data.name === 'Saturn') {
            // Saturn bands (more subtle)
            for (let y = 0; y < 256; y += 15) {
                const shade = 200 + Math.sin(y * 0.1) * 30;
                ctx.fillStyle = `rgb(${shade}, ${shade * 0.85}, ${shade * 0.5})`;
                ctx.fillRect(0, y, 256, 15);
            }
        } else {
            // Generic texture noise
            for (let i = 0; i < 300; i++) {
                const shade = 0.8 + Math.random() * 0.4;
                ctx.fillStyle = `rgba(${r * shade}, ${g * shade}, ${b * shade}, 0.5)`;
                ctx.fillRect(
                    Math.random() * 256,
                    Math.random() * 256,
                    3 + Math.random() * 8,
                    3 + Math.random() * 8
                );
            }
        }

        return new THREE.CanvasTexture(canvas);
    },

    createRingTexture(color) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        const r = (color >> 16) & 255;
        const g = (color >> 8) & 255;
        const b = color & 255;

        // Create gradient rings
        for (let x = 0; x < 256; x++) {
            const opacity = 0.3 + Math.sin(x * 0.1) * 0.2 + Math.random() * 0.2;
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
            ctx.fillRect(x, 0, 1, 64);
        }

        return new THREE.CanvasTexture(canvas);
    },

    createOrbitPath(distance) {
        const points = [];
        const segments = 128;

        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            points.push(new THREE.Vector3(
                Math.cos(angle) * distance,
                0,
                Math.sin(angle) * distance
            ));
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0x334455,
            transparent: true,
            opacity: 0.3
        });

        const orbitLine = new THREE.LineLoop(geometry, material);
        this.scene.add(orbitLine);
    },

    createAsteroidBelt() {
        // Asteroid belt between Mars and Jupiter
        const asteroidCount = 500;
        const innerRadius = 10.5;
        const outerRadius = 13;

        for (let i = 0; i < asteroidCount; i++) {
            const geometry = new THREE.IcosahedronGeometry(0.03 + Math.random() * 0.08, 0);

            // Deform for irregular shape
            const positions = geometry.attributes.position;
            for (let j = 0; j < positions.count; j++) {
                const x = positions.getX(j);
                const y = positions.getY(j);
                const z = positions.getZ(j);
                const noise = (Math.random() - 0.5) * 0.4;
                const length = Math.sqrt(x * x + y * y + z * z);
                const newLength = length + noise;
                positions.setX(j, (x / length) * newLength);
                positions.setY(j, (y / length) * newLength);
                positions.setZ(j, (z / length) * newLength);
            }
            geometry.computeVertexNormals();

            const material = new THREE.MeshStandardMaterial({
                color: 0x666655,
                roughness: 0.9,
                flatShading: true
            });

            const asteroid = new THREE.Mesh(geometry, material);

            const distance = innerRadius + Math.random() * (outerRadius - innerRadius);
            const angle = Math.random() * Math.PI * 2;
            const height = (Math.random() - 0.5) * 1;

            asteroid.userData = {
                distance: distance,
                angle: angle,
                height: height,
                speed: 0.3 + Math.random() * 0.2,
                rotationSpeed: {
                    x: (Math.random() - 0.5) * 0.02,
                    y: (Math.random() - 0.5) * 0.02,
                    z: (Math.random() - 0.5) * 0.02
                }
            };

            this.asteroids.push(asteroid);
            this.scene.add(asteroid);
        }
    },

    createStarfield() {
        const starCount = 500;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);

        for (let i = 0; i < starCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = 50 + Math.random() * 100;

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);

            // Star color variation
            const colorChoice = Math.random();
            if (colorChoice < 0.6) {
                // White
                colors[i * 3] = 1;
                colors[i * 3 + 1] = 1;
                colors[i * 3 + 2] = 1;
            } else if (colorChoice < 0.8) {
                // Yellow
                colors[i * 3] = 1;
                colors[i * 3 + 1] = 0.95;
                colors[i * 3 + 2] = 0.8;
            } else if (colorChoice < 0.9) {
                // Blue
                colors[i * 3] = 0.8;
                colors[i * 3 + 1] = 0.9;
                colors[i * 3 + 2] = 1;
            } else {
                // Red
                colors[i * 3] = 1;
                colors[i * 3 + 1] = 0.7;
                colors[i * 3 + 2] = 0.6;
            }

            sizes[i] = 0.05 + Math.random() * 0.15;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const material = new THREE.PointsMaterial({
            size: 0.15,
            transparent: true,
            opacity: 0.9,
            sizeAttenuation: true,
            vertexColors: true
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    },

    createCoronaParticles() {
        const particleCount = 200;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = 1.5 + Math.random() * 0.3;

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);

            velocities.push({
                x: positions[i * 3] * 0.015,
                y: positions[i * 3 + 1] * 0.015,
                z: positions[i * 3 + 2] * 0.015,
                life: Math.random()
            });
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0xFFAA44,
            size: 0.12,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });

        this.coronaParticles = new THREE.Points(geometry, material);
        this.coronaParticles.userData = { velocities };
        this.scene.add(this.coronaParticles);
    },

    setupEventListeners() {
        window.addEventListener('resize', () => this.handleResize());
        this.setupFormValidation();
    },

    setupFormValidation() {
        const emailInput = document.getElementById('login-email');
        const passwordInput = document.getElementById('login-password');

        if (emailInput) {
            emailInput.addEventListener('input', (e) => this.validateEmail(e.target.value));
        }

        if (passwordInput) {
            passwordInput.addEventListener('input', (e) => this.validatePassword(e.target.value));
        }
    },

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const wasValid = this.validationState.emailValid;
        this.validationState.emailValid = emailRegex.test(email);

        if (this.validationState.emailValid !== wasValid) {
            this.updateSunIntensity();
        }
        this.checkAllConditions();
    },

    validatePassword(password) {
        const wasStrong = this.validationState.passwordStrong;
        this.validationState.passwordStrong = password.length >= 6;

        if (this.validationState.passwordStrong !== wasStrong) {
            this.updateSunIntensity();
        }
        this.checkAllConditions();
    },

    checkAllConditions() {
        const wasAllMet = this.validationState.allConditionsMet;
        this.validationState.allConditionsMet =
            this.validationState.emailValid && this.validationState.passwordStrong;

        if (this.validationState.allConditionsMet !== wasAllMet) {
            this.triggerSuperNova();
        }
    },

    updateSunIntensity() {
        if (!this.sun) return;

        let intensity = 1;
        if (this.validationState.emailValid) intensity += 0.25;
        if (this.validationState.passwordStrong) intensity += 0.25;

        this.sun.userData.intensity = intensity;
        this.sunLight.intensity = 2.5 * intensity;

        if (typeof gsap !== 'undefined') {
            gsap.to(this.sun.scale, {
                x: intensity,
                y: intensity,
                z: intensity,
                duration: 0.5,
                ease: 'power2.out'
            });
        }
    },

    triggerSuperNova() {
        if (!this.sun || typeof gsap === 'undefined') return;

        if (this.validationState.allConditionsMet) {
            gsap.to(this.sun.scale, {
                x: 1.8,
                y: 1.8,
                z: 1.8,
                duration: 0.3,
                ease: 'power2.out',
                yoyo: true,
                repeat: 1
            });

            this.sunLight.intensity = 6;
            gsap.to(this.sunLight, {
                intensity: 3.5,
                duration: 1,
                ease: 'power2.out'
            });
        }
    },

    handleResize() {
        if (!this.container) return;

        const width = this.container.offsetWidth;
        const height = this.container.offsetHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    },

    animate() {
        requestAnimationFrame(() => this.animate());

        this.time += 0.016;

        this.updateCameraPosition();
        this.animateSun();
        this.animatePlanets();
        this.animateAsteroids();
        this.animateCoronaParticles();

        if (this.particles) {
            this.particles.rotation.y += 0.00002;
        }

        this.renderer.render(this.scene, this.camera);
    },

    animateSun() {
        if (!this.sun) return;

        this.sun.userData.pulsePhase += 0.02;
        const pulse = Math.sin(this.sun.userData.pulsePhase) * 0.05 + 1;

        // Pulse glow layers
        if (this.sun.children[1]) {
            this.sun.children[1].scale.setScalar(pulse * 1.1);
        }
        if (this.sun.children[2]) {
            this.sun.children[2].scale.setScalar(pulse * 1.2);
        }

        // Rotate sun
        this.sun.children[0].rotation.y += 0.002;

        // Flicker light
        const intensity = this.sun.userData.intensity || 1;
        this.sunLight.intensity = (2.5 + Math.sin(this.time * 3) * 0.3) * intensity;
    },

    animatePlanets() {
        this.planets.forEach(planetGroup => {
            const data = planetGroup.userData;

            // Orbital motion
            data.angle += data.speed * 0.003;

            planetGroup.position.x = Math.cos(data.angle) * data.distance;
            planetGroup.position.z = Math.sin(data.angle) * data.distance;
            planetGroup.position.y = Math.sin(data.angle * 2) * data.tilt * 0.5;

            // Planet rotation
            if (data.planet) {
                data.planet.rotation.y += data.rotationSpeed;
            }

            // Apply axial tilt
            planetGroup.rotation.z = data.tilt;

            // Animate moon (Earth)
            if (data.moon) {
                data.moon.userData.angle += data.moon.userData.speed * 0.01;
                const moonAngle = data.moon.userData.angle;
                const moonDist = data.moon.userData.distance;
                data.moon.position.x = Math.cos(moonAngle) * moonDist;
                data.moon.position.z = Math.sin(moonAngle) * moonDist;
            }

            // Animate moons (Jupiter)
            if (data.moons) {
                data.moons.forEach(moon => {
                    moon.userData.angle += moon.userData.speed * 0.01;
                    const moonAngle = moon.userData.angle;
                    const moonDist = moon.userData.distance;
                    moon.position.x = Math.cos(moonAngle) * moonDist;
                    moon.position.z = Math.sin(moonAngle) * moonDist;
                });
            }
        });
    },

    animateAsteroids() {
        this.asteroids.forEach(asteroid => {
            const data = asteroid.userData;

            // Orbital motion
            data.angle += data.speed * 0.002;

            asteroid.position.x = Math.cos(data.angle) * data.distance;
            asteroid.position.z = Math.sin(data.angle) * data.distance;
            asteroid.position.y = data.height + Math.sin(data.angle * 3) * 0.1;

            // Tumbling rotation
            asteroid.rotation.x += data.rotationSpeed.x;
            asteroid.rotation.y += data.rotationSpeed.y;
            asteroid.rotation.z += data.rotationSpeed.z;
        });
    },

    animateCoronaParticles() {
        if (!this.coronaParticles) return;

        const positions = this.coronaParticles.geometry.attributes.position;
        const velocities = this.coronaParticles.userData.velocities;

        for (let i = 0; i < velocities.length; i++) {
            let x = positions.getX(i);
            let y = positions.getY(i);
            let z = positions.getZ(i);

            x += velocities[i].x;
            y += velocities[i].y;
            z += velocities[i].z;

            velocities[i].life += 0.01;

            const dist = Math.sqrt(x * x + y * y + z * z);
            if (dist > 3.5 || velocities[i].life > 1) {
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                const radius = 1.5 + Math.random() * 0.2;

                x = radius * Math.sin(phi) * Math.cos(theta);
                y = radius * Math.sin(phi) * Math.sin(theta);
                z = radius * Math.cos(phi);

                velocities[i].x = x * 0.018;
                velocities[i].y = y * 0.018;
                velocities[i].z = z * 0.018;
                velocities[i].life = 0;
            }

            positions.setXYZ(i, x, y, z);
        }

        positions.needsUpdate = true;
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        SolarOrbit.init();
    }, 100);
});

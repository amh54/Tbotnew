module.exports = {
  name: `zombieleap`,
  aliases: [`l`],
  category: `Miscellaneous`,
  run: async (client, message, args) => {
    if (message.channel.id != "780141103558295592") {
      message.author.send(
        "Please use this command in Tbones server only in his bot spam channel <#780141103558295592> \n https://discord.gg/E5XzKf2PjN"
      );
    } else {
      const zerocost = [
        "Goat", 
        "Swabbie",
      ]
      const onecost = [
        "Cat Lady", 
        "Cheese Cutter",
        "Dog Walker", 
        "Fraidy Cat",
        "Skunk Punk",
        "Snorkel Zombie",
        "Cardboard Robot Zombie", 
        "Chimney Sweep",
        "Interdimensional Zombie",
        "Genetic Experiment",
        "Leprechaun Imp",
        "Mustache Waxer",
        "Neutron Imp",
        "Backup Dancer",
        "Disco-Naut",
        "Grave Robber",
        "Loose Cannon",
        "Mystery Egg",
        "Quickdraw Con Man",
        "Tennis Champ",
        "Unlife of the Party",
        "Arm Wrestler",
        "Baseball Zombie",
        "Paparazzi Zombie",
        "Planetary Gladiator", 
        "Zombie Middle Manager",
        "Zombology Teacher",
        "Buried Treasure",
        "Ducky Tube Zombie",
        "Headstone Carver",
        "Imp",
        "Imposter",
        "Mini-Ninja",
        "Zombie Chicken",
      ]
      const twocost = [
        "Biodome Botanist",
        "Cyborg Zombie",
        "Energy Drink Zombie",
        "Haunting Ghost",
        "Haunting Zombie",
        "Killer Whale",
        "Pied Piper",
        "Squirrel Herder",
        "Synchronized Swimmer",
        "Zookeeper",
        "Cosmic Scientist",
        "Pool Shark",
        "Teleportation Zombie",
        "Zombot Drone Engineer",
        "Aerobics Instructor",
        "Barrel of Deadbeards",
        "Conga Zombie",
        "Cuckoo Zombie",
        "Disco Dance Floor",
        "Newspaper Zombie",
        "Quasar Wizard",
        "Space Ninja",
        "Zombie's Best Friend",
        "Conehead",
        "Flag Zombie",
        "Gargologist",
        "Jurassic Fossilhead",
        "Lost Colosseum", 
        "Sumo Wrestler",
        "Turkey Rider",
        "Dr. Spacetime",
        "Fire Rooster",
        "Fishy Imp",
        "Hot Dog Imp",
        "Ice Pirate",
        "Imp-Throwing Imp",
        "Monkey Smuggler",
        "Swashbuckler Zombie",
        "Toxic Waste Imp",
      ]
      const threecost = [
        "Dolphin Rider",
        "Hover-Goat 3000",
        "Loudmouth",
        "Vimpire", 
        "Zombie Yeti",
        "Brain Vendor",
        "Duckstache", 
        "Electrician", 
        "Gentleman Zombie",
        "Kite Flyer",
        "Moonwalker", 
        "Mustache Monument", 
        "Regifting Zombie",
        "Trick-or-Treater",
        "Wormhole Gatekeeper",
        "Zomblob", 
        "Abracadaver",
        "Disco Zombie",
        "Exploding Imp", 
        "Fireworks Zombie",
        "Gizzard Lizard",
        "Jester",
        "Cosmic Sports Star", 
        "Landscaper", 
        "Team Mascot", 
        "Trash Can Zombie",
        "Captain Flameface",
        "Cosmic Imp", 
        "Excavator Zombie", 
        "Imp Commander", 
        "Line Dancing Zombie",
        "Raiding Raptor", 
        "Smelly Zombie", 
        "Space Pirate", 
        "Stealthy Imp",
        "Zombie High Diver"
      ]
      const fourcost = [
        "Ancient Vimpire", 
        "Cosmic Yeti", 
        "Interstellar Bounty Hunter",
        "Kangaroo Rider",
        "Overstuffed Zombie",
        "Primordial Cheese Shover",
        "Sneezing Zombie", 
        "Surfer Zombie", 
        "Drum Major",
        "Mad Chemist",
        "Mountain Climber",
        "Parasol Zombie", 
        "Bobblehead", 
        "Cosmic Dancer",
        "Gargantuar-Throwing Imp",
        "Orchestra Conductor", 
        "Stupid Cupid", 
        "Tankylosaurus",
        "Valkyrie",
        "Bonus Track Buckethead", 
        "Buckethead", 
        "Celestial Custodian", 
        "Medic", 
        "Stompadon", 
        "Turquoise Skull Zombie", 
        "Zombie Coach", 
        "Zombie King", 
        "Barrel Roller Zombie", 
        "Firefighter",
        "Pogo Bouncer", 
        "Space Cowboy",
        "Tomb Raiser Zombie",
        "Trapper Zombie",
        "Unthawed Viking",
      ]
     const fivecost = [
        "Mondo Bronto", 
        "Smashing Gargantuar", 
        "Supernova Gargantuar",
        "Vengeful Cyborg", 
        "Gargantaur Mime", 
        "Portal Technician",
        "Shieldcrusher Viking",
        "Binary Stars", 
        "Flamenco Zombie", 
        "Foot Solider Zombie", 
        "Frankentuar", 
        "Hippity Hop Gargantuar", 
        "Imp-Throwing Gargantuar",
        "All-star Zombie",
        "Chum Champion",
        "Intergalactic Warlord",
        "Primeval Yeti", 
        "Ra Zombie", 
        "Screen Door Zombie",
        "Blowgun Imp", 
        "Cryo-Yeti", 
        "Mixed-Up Gravedigger",
        "Suprise Gargantuar",
        "Walrus Rider",
      ]
      const sixcost = [
        "Deep Sea Gargantuar",
        "King of the Grill",
        "Kitchen Sink Zombie",
        "Wizard Gargantuar",
        "Disco-Tron 3000",
        "Gas Giant", 
        "Coffee Zombie", 
        "Defensive End", 
        "Undying Pharaoh",
        "Zombot Battlecruiser 5000",
        "Cursed Gargolith",
        "Zombot Aerostatic Gondola",
      ]
      const sevencost = [
        "Gargantuar-Throwing Gargantuar",
        "Nurse Gargantuar",
        "Zombot Dinotronic Mechasaur",
        "Knight of the Living Dead",
        "Rodeo Gargantuar",
        "Wannabe Hero", 
      ]
      const eightcost = [
        "Octo Zombie", 
        "Plank Walker"
      ]
      const ninecost = [
        "Zombot 1000"
      ]
      const tencost = [
        "Trickster"
      ]
      const zerodrop = zerocost[Math.floor(Math.random() * zerocost.length)];
      const onedrop = onecost[Math.floor(Math.random() * onecost.length)];
      const twodrop = twocost[Math.floor(Math.random() * twocost.length)];
      const threedrop = threecost[Math.floor(Math.random() * threecost.length)];
      const fourdrop = fourcost[Math.floor(Math.random() * fourcost.length)];
      const fivedrop = fivecost[Math.floor(Math.random() * fivecost.length)];
      const sixdrop = sixcost[Math.floor(Math.random() * sixcost.length)];
      const sevendrop = sevencost[Math.floor(Math.random() * sevencost.length)];
      const eightdrop = eightcost[Math.floor(Math.random() * eightcost.length)];
      const ninedrop = ninecost[Math.floor(Math.random() * ninecost.length)];
      const tendrop = tencost[Math.floor(Math.random() * tencost.length)];
      const repeatedZeroDrop = `You Have leaped ${zerodrop} into ${onedrop}`;
      const repeatZeroDropCount = 68;
      const leap= []
      for (let i = 0; i < repeatZeroDropCount; i++) {
        leap.push(repeatedZeroDrop);
      }
     const repeatedOneDrop = `You Have leaped ${onedrop} into ${twodrop}`;
    const repeatOneDropCount = 1326;
    for (let i = 0; i < repeatOneDropCount; i++) {
      leap.push(repeatedOneDrop);
    }
    const repeatedTwoDrop = `You Have leaped ${twodrop} into ${threedrop}`;
    const repeatTwoDropCount = 1404;
    for (let i = 0; i < repeatTwoDropCount; i++) {
      leap.push(repeatedTwoDrop);
    }
    const repeatedThreeDrop = `You Have leaped ${threedrop} into ${fourdrop}`;
    const repeatThreeDropCount = 1224;
    for (let i = 0; i < repeatThreeDropCount; i++) {
      leap.push(repeatedThreeDrop);
    }
    const repeatedFourDrop = `You Have leaped ${fourdrop} into ${fivedrop}`;
    const repeatFourDropCount = 816;
    for (let i = 0; i < repeatFourDropCount; i++) {
      leap.push(repeatedFourDrop);
    }
    const repeatedFiveDrop = `You Have leaped ${fivedrop} into ${sixdrop}`;
    const repeatFiveDropCount = 288;
    for (let i = 0; i < repeatFiveDropCount; i++) {
      leap.push(repeatedFiveDrop);
    }
    const repeatedSixDrop = `You Have leaped ${sixdrop} into ${sevendrop}`;
    const repeatSixDropCount = 72;
    for (let i = 0; i < repeatSixDropCount; i++) {
      leap.push(repeatedSixDrop);
    }
    const repeatedSevenDrop = `You Have leaped ${sevendrop} into ${eightdrop}`;
    const repeatSevenDropCount = 12;
    for (let i = 0; i < repeatSevenDropCount; i++) {
      leap.push(repeatedSevenDrop);
    }
    const repeatedEightDrop = `You Have leaped ${eightdrop} into ${ninedrop}`;
    const repeatEightDropCount = 2;
    for (let i = 0; i < repeatEightDropCount; i++) {
      leap.push(repeatedEightDrop);
    }
    const repeatedNineDrop = `You Have leaped ${ninedrop} into ${tendrop}`;
    const repeatNineDropCount = 1;
    for (let i = 0; i < repeatNineDropCount; i++) {
      leap.push(repeatedNineDrop);
    }
      message.channel.send(`${leap[Math.floor(Math.random() * leap.length)]}`);
  }
  },
};

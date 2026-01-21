# Teknisk overblik og antagelser

Denne side beskriver de tekniske antagelser, begreber og beregningsprincipper,
som ligger til grund for gearberegneren. Formålet er at skabe gennemsigtighed
i, hvordan resultaterne opstår, og hvordan værktøjet bør anvendes.

Dokumentationen er tænkt som et teknisk supplement til selve værktøjet – ikke
som en komplet lærebog i cykelmekanik.


## Overordnet beregningsmodel

Gearberegneren tager udgangspunkt i et simpelt, deterministisk forhold mellem:

- klinge (forreste tandhjul)
- tandhjul (bagerste kassette)
- hjul- og dækopsætning
- kadence (RPM)

Ud fra disse parametre beregnes:

- gear-ratio
- gearudvikling (meter pr. pedalomdrejning)
- hastighed ved given kadence

Beregningerne er statiske og tager ikke højde for faktorer som luftmodstand,
rullemodstand, dækslør eller effekt (watt).


## Gear-ratio

Gear-ratio defineres som forholdet mellem antal tænder på klingen og antal
tænder på det valgte tandhjul:

gear-ratio = klinge / tandhjul

Dette forhold beskriver, hvor mange gange baghjulet roterer for hver
pedalomdrejning.


## Gearudvikling

Gearudvikling angiver, hvor langt cyklen bevæger sig frem pr. pedalomdrejning
og beregnes som:

gearudvikling = gear-ratio × hjulomkreds

Resultatet angives typisk i meter pr. omdrejning og bruges ofte til at
sammenligne gear på tværs af forskellige cykeltyper og opsætninger.


## Hjul- og dækantagelser

Hjulomkreds er en kritisk parameter i alle gear- og hastighedsberegninger.
I praksis varierer den med:

- dækbredde
- dæktryk
- belastning
- producentens tolerancer

Beregneren anvender standardiserede omkredse som reference. Små afvigelser
mellem beregnet og reel hastighed må derfor forventes.


## Kadence og hastighed

Hastighed beregnes ud fra gearudvikling og kadence:

hastighed = gearudvikling × kadence

Resultatet konverteres til km/t for læsbarhed. Kadence angives i omdrejninger
pr. minut (RPM).


## Anvendelse og begrænsninger

Værktøjet er tænkt som:

- et referenceværktøj
- et sammenligningsværktøj
- et læringsværktøj

Det er ikke tænkt som en præcis måling af faktisk hastighed på landevejen.


## Videre læsning og relaterede værktøjer

En vedligeholdt version af gearberegneren samt andre cykelrelaterede værktøjer
og guides findes på:

[Bikeland.dk](https://bikeland.dk)
